#!/usr/bin/env python3
"""
bridge.py：Claude Code × Antigravity / Gemini 協作 orchestrator
只用 Python 標準函式庫（需要 3.11 以上）。

  python3 bridge.py init <專案資料夾>      把範本裝進專案
  python3 .bridge/bridge.py status         看目前進度
  python3 .bridge/bridge.py run            自動推進，直到需要你介入
  python3 .bridge/bridge.py approve        核准目前的檢查點
  python3 .bridge/bridge.py reject -m "…"  退回目前的檢查點
  python3 .bridge/bridge.py change -m "…"  SPEC 鎖定後提出需求變更
  python3 .bridge/bridge.py metrics        需求品質指標
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tomllib
from datetime import datetime
from pathlib import Path

KIT_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = KIT_DIR / "template"
GLOBAL_PROFILE = Path.home() / ".config" / "bridge" / "USER_PROFILE.md"

PHASE_LABEL = {
    "elicit": "需求訪談",
    "spec_review": "★ 檢查點 1：核准 SPEC",
    "plan": "計畫",
    "plan_review": "☆ 檢查點 2：核准 PLAN",
    "build": "實作與交叉審查",
    "verify": "驗收",
    "demo_review": "★ 檢查點 3：看 demo",
    "done": "完成",
}
GATES = {"spec_review", "plan_review", "demo_review"}
WORKFLOW_FOR = {"task": "/bridge-task", "verify": "/bridge-verify"}


class Halt(Exception):
    """需要人類（或 IDE 內的 agent）介入，停止自動推進。"""

    def __init__(self, message: str, who: str = "human"):
        super().__init__(message)
        self.who = who


# ---------- frontmatter ----------

FM_RE = re.compile(r"\A---\n(.*?)\n---\n", re.S)


def read_fm(path: Path) -> dict:
    m = FM_RE.match(path.read_text(encoding="utf-8"))
    meta: dict = {}
    if not m:
        return meta
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        value = value.split(" #", 1)[0].strip()
        if value.startswith("[") and value.endswith("]"):
            value = [x.strip().strip("'\"") for x in value[1:-1].split(",") if x.strip()]
        meta[key.strip()] = value
    return meta


def write_fm(path: Path, key: str, value) -> None:
    text = path.read_text(encoding="utf-8")
    m = FM_RE.match(text)
    if not m:
        raise Halt(f"{path} 沒有 frontmatter（--- 區塊），無法更新 {key}")
    block, line = m.group(1), f"{key}: {value}"
    pattern = re.compile(rf"^{re.escape(key)}:.*$", re.M)
    block = pattern.sub(lambda _: line, block, count=1) if pattern.search(block) else f"{block}\n{line}"
    path.write_text(f"---\n{block}\n---\n{text[m.end():]}", encoding="utf-8")


def norm_id(x) -> str:
    return str(x).strip().lstrip("0") or "0"


def verdict(path: Path) -> str | None:
    if not path.exists():
        return None
    found = re.findall(r"VERDICT:\s*(PASS|FAIL)", path.read_text(encoding="utf-8"))
    return found[-1] if found else None


def section(text: str, heading: str) -> str:
    m = re.search(rf"^## {re.escape(heading)}\s*$(.*?)(?=^## |\Z)", text, re.M | re.S)
    if not m:
        return ""
    return re.sub(r"<!--.*?-->", "", m.group(1), flags=re.S).strip()


def now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


# ---------- 主體 ----------


class Bridge:
    def __init__(self, root: Path):
        self.root = root
        self.dir = root / ".bridge"
        self.cfg = tomllib.loads((self.dir / "config.toml").read_text(encoding="utf-8"))
        self.state_path = self.dir / "state.json"
        if self.state_path.exists():
            self.state = json.loads(self.state_path.read_text(encoding="utf-8"))
        else:
            self.state = {
                "phase": "elicit",
                "awaiting": "human",
                "message": "請在 Claude Code 執行 /elicit 開始需求訪談。",
                "spec_hash": None,
                "spec_version": 0,
                "plan_step": "plan",
                "plan_round": 0,
                "verify_round": 0,
                "verify_fails": 0,
                "pending": [],
                "metrics": {"spec_rejections": 0, "plan_rejections": 0,
                            "demo_rejections": 0, "change_requests": 0},
                "history": [],
            }

    # ----- 狀態 -----

    @property
    def phase(self) -> str:
        return self.state["phase"]

    def set_phase(self, phase: str) -> None:
        self.log(f"階段：{PHASE_LABEL[self.phase]} → {PHASE_LABEL[phase]}")
        self.state["phase"] = phase

    def log(self, msg: str) -> None:
        self.state["history"].append(f"{now()} {msg}")
        self.state["history"] = self.state["history"][-200:]
        print(f"  · {msg}")

    def rel(self, p: Path) -> str:
        return str(p.relative_to(self.root))

    def save(self) -> None:
        self.state_path.write_text(json.dumps(self.state, ensure_ascii=False, indent=2), encoding="utf-8")
        who = {"human": "你", None: "（無，可以執行 run）"}.get(self.state.get("awaiting"),
                                                           self.state.get("awaiting"))
        lines = [
            "# Bridge 狀態（由 bridge.py 自動產生，請勿手動編輯）",
            "",
            f"- 更新時間：{now()}",
            f"- 階段：**{PHASE_LABEL[self.phase]}**",
            f"- 等待：**{who}**",
            f"- 訊息：{self.state.get('message') or ''}",
            "",
            "## 任務",
            "",
            "| id | 標題 | owner | 狀態 | 嘗試次數 |",
            "|---|---|---|---|---|",
        ]
        for t in self.tasks():
            lines.append(f"| {t['id']} | {t.get('title', '')} | {t.get('owner', '')} | "
                         f"{t.get('status', '')} | {t.get('attempts', 0)} |")
        lines += ["", "## 最近紀錄", ""] + [f"- {h}" for h in self.state["history"][-12:]]
        (self.dir / "STATUS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    def spec_path(self) -> Path:
        return self.dir / "SPEC.md"

    def spec_digest(self) -> str:
        return hashlib.sha256(self.spec_path().read_bytes()).hexdigest()

    def tasks(self) -> list[dict]:
        out = []
        for p in sorted((self.dir / "tasks").glob("*.md")):
            if p.name.startswith("_"):
                continue
            t = read_fm(p)
            t["_path"] = p
            t.setdefault("id", p.stem.split("-")[0])
            t.setdefault("status", "todo")
            deps = t.get("depends_on") or []
            t["depends_on"] = deps if isinstance(deps, list) else [deps]
            out.append(t)
        return out

    def notify(self, msg: str) -> None:
        cmd = self.cfg.get("notify", {}).get("cmd") or []
        if cmd:
            try:
                subprocess.run([*cmd, msg[:200]], timeout=10, capture_output=True)
            except (OSError, subprocess.SubprocessError):
                pass

    def git(self, *args: str) -> bool:
        if not (self.root / ".git").exists():
            return False
        r = subprocess.run(["git", *args], cwd=self.root, capture_output=True, text=True)
        return r.returncode == 0

    def commit(self, msg: str, tag: str | None = None, everything: bool = False) -> None:
        if not self.cfg.get("git", {}).get("auto_commit", True):
            return
        if everything:
            self.git("add", "-A")
            ok = self.git("commit", "-m", msg)
        else:
            self.git("add", "--", ".bridge")
            ok = self.git("commit", "-m", msg, "--", ".bridge")
        if ok and tag:
            self.git("tag", "-f", tag)

    # ----- agent 呼叫 -----

    def render(self, name: str, **vars) -> str:
        text = (self.dir / "prompts" / f"{name}.md").read_text(encoding="utf-8")
        agents = [a for a, c in self.cfg.get("agents", {}).items() if c.get("manual") or c.get("cmd")]
        defaults = {
            "agents": "、".join(agents),
            "test_command": self.cfg.get("tests", {}).get("command") or "（未設定）",
            "start": self.cfg.get("tests", {}).get("start") or "（未設定，請依 PLAN 或 README 判斷）",
        }
        for k, v in {**defaults, **vars}.items():
            text = text.replace("{{" + k + "}}", str(v))
        return text

    def do(self, key: str, agent: str, prompt_name: str, label: str, check, headless_check=None, **vars):
        """執行一個 agent 步驟。

        headless agent：直接呼叫 CLI，結束後用 headless_check（或 check）確認有產生結果。
        manual agent（例如 Antigravity IDE）：寫指示檔到 inbox 後暫停；下次 run 時用 check 判斷是否已完成。
        """
        pending = self.state.setdefault("pending", [])
        inbox = self.dir / "inbox" / f"{key}.md"
        workflow = WORKFLOW_FOR.get(key.split("-")[0])
        how = f"執行 workflow `{workflow}`" if workflow else f"把 {self.rel(inbox)} 的內容貼給 agent"
        if key in pending:
            if check():
                pending.remove(key)
                self.log(f"{agent} 完成：{label}")
                return
            raise Halt(f"還在等 {agent} 完成：{label}。請在 {agent} {how}（指示檔 {self.rel(inbox)}）。"
                       "完成後再執行 run。", who=agent)

        prompt = self.render(prompt_name, **vars)
        acfg = self.cfg.get("agents", {}).get(agent)
        if acfg is None:
            raise Halt(f"config.toml 沒有設定 agent「{agent}」（{label}）")

        if acfg.get("manual") or not acfg.get("cmd"):
            inbox.parent.mkdir(exist_ok=True)
            inbox.write_text(prompt, encoding="utf-8")
            pending.append(key)
            raise Halt(f"輪到 {agent}：{label}。請在 {agent} {how}。完成後執行 run 繼續。", who=agent)

        cmd = [c.replace("{prompt}", prompt) for c in acfg["cmd"]]
        log_dir = self.dir / "logs"
        log_dir.mkdir(exist_ok=True)
        log = log_dir / f"{datetime.now():%Y%m%d-%H%M%S}-{agent}-{key}.log"
        print(f"  → {agent}：{label}")
        timeout = self.cfg.get("limits", {}).get("agent_timeout_sec", 1800)
        try:
            r = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True, timeout=timeout)
        except FileNotFoundError:
            raise Halt(f"找不到指令 `{cmd[0]}`。請安裝它，或修改 config.toml 的 [agents.{agent}]。")
        except subprocess.TimeoutExpired:
            raise Halt(f"{agent} 超過 {timeout} 秒沒有結束：{label}")
        log.write_text(f"$ {cmd[0]} …\n\n--- stdout ---\n{r.stdout}\n--- stderr ---\n{r.stderr}", encoding="utf-8")
        if r.returncode != 0:
            raise Halt(f"{agent} 執行失敗（exit {r.returncode}）：{label}。看 {self.rel(log)}")
        if not (headless_check or check)():
            raise Halt(f"{agent} 執行結束，但沒有產生預期的結果：{label}。看 {self.rel(log)}")
        self.log(f"{agent} 完成：{label}")

    # ----- 各階段 -----

    def validate_spec(self) -> list[str]:
        text = self.spec_path().read_text(encoding="utf-8")
        problems = []
        if not re.search(r"AC-\d+", text):
            problems.append("沒有任何驗收條件（AC-n）")
        if not section(text, "非目標（這次不做）"):
            problems.append("「非目標」是空的")
        if section(text, "未決問題"):
            problems.append("「未決問題」還沒清空")
        return problems

    def step(self) -> None:
        """推進一步；需要人介入時丟出 Halt。"""
        if self.state.get("spec_hash") and self.phase not in ("elicit", "spec_review"):
            if self.spec_digest() != self.state["spec_hash"]:
                raise Halt("SPEC.md 在核准後被修改了。若是要變更需求，請用 "
                           "`bridge.py change -m \"說明\"`；若是誤改，請用 git 還原 .bridge/SPEC.md。")
        getattr(self, f"phase_{self.phase}")()

    def phase_elicit(self) -> None:
        if read_fm(self.spec_path()).get("status") != "ready":
            raise Halt("請在 Claude Code 執行 /elicit 進行需求訪談。")
        problems = self.validate_spec()
        if problems:
            raise Halt("SPEC 還不完整：" + "；".join(problems) + "。請回到 /elicit 補齊。")
        self.set_phase("spec_review")

    def phase_spec_review(self) -> None:
        text = self.spec_path().read_text(encoding="utf-8")
        acs = re.findall(r"^\s*-\s*(AC-\d+.*)$", text, re.M)
        preview = "\n".join(f"    {a[:90]}" for a in acs[:12])
        raise Halt("檢查點 1：請閱讀 .bridge/SPEC.md，特別是驗收條件與假設。\n"
                   f"  驗收條件（{len(acs)} 條）：\n{preview}\n"
                   "  沒問題 → approve；要修改 → reject -m \"原因\"")

    def phase_plan(self) -> None:
        r = self.state.get("plan_round", 0) + 1
        roles = self.cfg.get("roles", {})
        planner, critic = roles.get("planner", "claude"), roles.get("critic", "gemini")
        critique = self.dir / "reviews" / f"plan-critique-{r}.md"
        if self.state.get("plan_step", "plan") == "plan":
            self.do(f"plan-{r}", planner, "plan", "撰寫計畫與拆任務", lambda: bool(self.tasks()))
            self.state["plan_step"] = "critique"
            self.save()
        if self.state["plan_step"] == "critique":
            if critic and critic != "none":
                self.do(f"critique-{r}", critic, "critique", "挑戰計畫", critique.exists,
                        review_file=self.rel(critique))
            self.state["plan_step"] = "revise" if critique.exists() else "finish"
            self.save()
        if self.state["plan_step"] == "revise":
            self.do(f"revise-{r}", planner, "revise", "依審查意見修訂計畫",
                    lambda: "planner 回應" in critique.read_text(encoding="utf-8"),
                    review_file=self.rel(critique))
        self.state.update(plan_step="plan", plan_round=r)
        need_review = self.cfg.get("checkpoints", {}).get("plan_review", True)
        self.set_phase("plan_review" if need_review else "build")

    def phase_plan_review(self) -> None:
        raise Halt(f"檢查點 2：請看 .bridge/PLAN.md（共 {len(self.tasks())} 個任務，審查意見在 .bridge/reviews/）。\n"
                   "  沒問題 → approve；要修改 → reject -m \"原因\"")

    def phase_build(self) -> None:
        ts = self.tasks()
        if not ts:
            raise Halt("沒有任何任務檔。請退回計畫階段。")
        done = {norm_id(t["id"]) for t in ts if t["status"] == "done"}

        for t in ts:
            if t["status"] == "review":
                return self.review_task(t)
        for t in ts:
            if t["status"] == "blocked":
                raise Halt(f"任務 {t['id']}「{t.get('title', '')}」被標為 blocked。請看 {self.rel(t['_path'])} "
                           "的交接筆記；處理後把 status 改回 todo，再執行 run。")

        ready = [t for t in ts if t["status"] in ("todo", "in_progress")
                 and all(norm_id(d) in done for d in t["depends_on"])]
        if ready:
            pending = self.state.get("pending", [])
            # 正在等 IDE 內 agent 的任務排到最後，先讓 headless agent 做別的
            ready.sort(key=lambda t: any(p.startswith(f"task-{t['id']}-") for p in pending))
            waiting = None
            for t in ready:
                try:
                    return self.implement(t)
                except Halt as h:
                    if h.who == "human":
                        raise
                    waiting = h
            raise waiting
        if len(done) == len(ts):
            self.set_phase("verify")
            return
        raise Halt("剩下的任務都在等依賴，可能有循環依賴或依賴了不存在的任務 id。請檢查 depends_on。")

    def implement(self, t: dict) -> None:
        path, owner = t["_path"], t.get("owner", "claude")
        if owner == "human":
            raise Halt(f"任務 {t['id']}「{t.get('title', '')}」需要你本人處理（{self.rel(path)}）。"
                       "完成後把 status 改成 done，再執行 run。")
        attempt = int(t.get("attempts") or 0)
        if t["status"] == "todo":
            write_fm(path, "status", "in_progress")
        reviews = sorted((self.dir / "reviews").glob(f"{t['id']}-r*.md"))

        def finished() -> bool:
            return read_fm(path).get("status") in ("review", "blocked", "done")

        def finalize_headless() -> bool:
            if read_fm(path).get("status") == "in_progress":
                write_fm(path, "status", "review")
            return True

        self.do(f"task-{t['id']}-a{attempt}", owner, "implement", f"實作任務 {t['id']}「{t.get('title', '')}」",
                finished, finalize_headless, owner=owner, task_file=self.rel(path),
                previous_review=self.rel(reviews[-1]) if reviews else "（無）")

    def review_task(self, t: dict) -> None:
        path, owner = t["_path"], t.get("owner", "claude")
        reviewer = t.get("reviewer") or self.cfg.get("roles", {}).get("reviewer_for", {}).get(owner)
        attempt = int(t.get("attempts") or 0)
        if not reviewer:
            write_fm(path, "status", "done")
            self.log(f"任務 {t['id']} 沒有指定 reviewer，直接標為完成")
            return
        review_file = self.dir / "reviews" / f"{t['id']}-r{attempt + 1}.md"
        self.do(f"review-{t['id']}-{attempt + 1}", reviewer, "review", f"審查任務 {t['id']}（{owner} 寫的）",
                lambda: verdict(review_file) is not None, owner=owner,
                task_file=self.rel(path), review_file=self.rel(review_file))

        if verdict(review_file) == "PASS":
            write_fm(path, "status", "done")
            self.log(f"任務 {t['id']} 審查通過")
            if self.cfg.get("git", {}).get("commit_per_task", True):
                self.commit(f"bridge: 任務 {t['id']} {t.get('title', '')}", everything=True)
            return

        attempt += 1
        write_fm(path, "attempts", attempt)
        limit = self.cfg.get("limits", {}).get("max_review_attempts", 3)
        if attempt >= limit:
            write_fm(path, "status", "blocked")
            raise Halt(f"任務 {t['id']} 已經 review 失敗 {attempt} 次，停下來等你判斷。"
                       f"最新意見：{self.rel(review_file)}。你可以修改任務描述、換 owner，"
                       "或把 attempts 歸零、status 改回 todo 再 run。")
        write_fm(path, "status", "todo")
        self.log(f"任務 {t['id']} 審查未通過（第 {attempt} 次），退回給 {owner}")

    def phase_verify(self) -> None:
        n = self.state.get("verify_round", 0) + 1
        tests = self.cfg.get("tests", {})
        result = self.state.get("test_result") or {}
        if result.get("round") != n:
            if tests.get("command"):
                print(f"  → 執行測試：{tests['command']}")
                r = subprocess.run(tests["command"], shell=True, cwd=self.root, capture_output=True, text=True)
                out = (r.stdout + r.stderr).strip().splitlines()
                result = {"round": n, "ok": r.returncode == 0, "summary": "\n".join(out[-40:])}
                self.log(f"自動測試{'通過' if result['ok'] else '失敗'}")
            else:
                result = {"round": n, "ok": True, "summary": "（未設定自動測試）"}
            self.state["test_result"] = result
            self.save()

        e2e = self.cfg.get("roles", {}).get("e2e", "none")
        review_file = self.dir / "reviews" / f"verify-r{n}.md"
        if e2e and e2e != "none":
            self.do(f"verify-r{n}", e2e, "verify", f"端到端驗收（第 {n} 輪）",
                    lambda: verdict(review_file) is not None, round=n,
                    review_file=self.rel(review_file), test_summary=result["summary"])

        e2e_ok = e2e in (None, "none") or verdict(review_file) == "PASS"
        if result["ok"] and e2e_ok:
            self.set_phase("demo_review")
            return

        self.state["verify_round"] = n
        fails = self.state["verify_fails"] = self.state.get("verify_fails", 0) + 1
        limit = self.cfg.get("limits", {}).get("max_verify_rounds", 3)
        if fails >= limit:
            raise Halt(f"驗收已經失敗 {fails} 輪，停下來等你判斷。看 {self.rel(review_file)} 與 .bridge/logs/。")
        detail = f"驗收報告：{self.rel(review_file)}" if review_file.exists() else ""
        self.add_task(f"修正第 {n} 輪驗收失敗",
                      f"讓所有驗收條件通過。{detail}\n\n自動測試輸出（節錄）：\n\n```\n{result['summary']}\n```")
        self.set_phase("build")

    def phase_demo_review(self) -> None:
        n = self.state.get("verify_round", 0) + 1
        raise Halt("檢查點 3：請實際試用，並看驗收報告 "
                   f".bridge/reviews/verify-r{n}.md 與證據 .bridge/evidence/。\n"
                   "  符合需求 → approve；不符合 → reject -m \"哪裡不對\"（會自動建立修正任務）")

    def phase_done(self) -> None:
        raise Halt("專案已完成 🎉 要加功能，請用 change -m \"說明\"。")

    def add_task(self, title: str, body: str) -> Path:
        nums = [int(t["id"]) for t in self.tasks() if str(t["id"]).isdigit()]
        tid = f"{(max(nums) if nums else 0) + 1:03d}"
        owner = self.cfg.get("roles", {}).get("fixer", "claude")
        path = self.dir / "tasks" / f"{tid}-fix.md"
        path.write_text(
            f"---\nid: {tid}\ntitle: {title}\nowner: {owner}\nstatus: todo\ndepends_on: []\n"
            f"reviewer:\nattempts: 0\n---\n\n## 目標\n\n{body}\n\n## 涵蓋的驗收條件\n\n- 驗收報告中失敗的所有 AC\n\n"
            "## 交接筆記\n",
            encoding="utf-8")
        self.log(f"建立修正任務 {tid}（owner: {owner}）")
        return path

    # ----- 人類指令 -----

    def run(self) -> None:
        try:
            while True:
                before = (self.phase, json.dumps(self.state.get("pending")))
                self.state["awaiting"] = None
                self.step()
                self.save()
                if (self.phase, json.dumps(self.state.get("pending"))) == before and self.phase != "build":
                    break
        except Halt as h:
            self.state["awaiting"] = h.who
            self.state["message"] = str(h).split("\n")[0]
            self.save()
            print(f"\n⏸  {h}")
            self.notify(str(h).split("\n")[0])

    def approve(self) -> None:
        phase = self.phase
        if phase == "elicit":
            try:
                self.phase_elicit()
            except Halt as h:
                sys.exit(str(h))
            phase = self.phase
        if phase == "spec_review":
            problems = self.validate_spec()
            if problems:
                sys.exit("無法核准：" + "；".join(problems))
            write_fm(self.spec_path(), "status", "locked")
            self.state["spec_hash"] = self.spec_digest()
            self.state["spec_version"] = self.state.get("spec_version", 0) + 1
            self.log(f"SPEC v{self.state['spec_version']} 已核准並鎖定")
            self.set_phase("plan")
            self.sync_profile()
            self.save()
            self.commit(f"bridge: 核准 SPEC v{self.state['spec_version']}",
                        tag=f"bridge/spec-v{self.state['spec_version']}")
        elif phase == "plan_review":
            self.log("PLAN 已核准")
            self.set_phase("build")
            self.save()
            self.commit("bridge: 核准 PLAN")
        elif phase == "demo_review":
            self.log("demo 已核准，專案完成")
            self.set_phase("done")
            self.save()
            self.commit("bridge: 專案完成", tag=f"bridge/done-v{self.state.get('spec_version', 1)}",
                        everything=True)
        else:
            sys.exit(f"目前階段是「{PHASE_LABEL[phase]}」，不是檢查點，沒有東西可以核准。")
        done = self.phase == "done"
        self.state.update(awaiting="human" if done else None,
                          message="專案已完成。" if done else "已核准，執行 run 繼續。")
        self.save()
        print("✅ 專案完成！" if done else "✅ 已核准，接著執行 run 繼續。")

    def reject(self, message: str) -> None:
        phase = self.phase
        if phase not in GATES:
            sys.exit(f"目前階段是「{PHASE_LABEL[phase]}」，不是檢查點。")
        with (self.dir / "FEEDBACK.md").open("a", encoding="utf-8") as f:
            f.write(f"\n## {now()}｜{PHASE_LABEL[phase]}\n\n{message}\n")
        m = self.state["metrics"]
        if phase == "spec_review":
            m["spec_rejections"] += 1
            write_fm(self.spec_path(), "status", "drafting")
            self.set_phase("elicit")
            hint = "請在 Claude Code 執行 /elicit，它會依回饋修改 SPEC。"
        elif phase == "plan_review":
            m["plan_rejections"] += 1
            self.set_phase("plan")
            hint = "執行 run，planner 會依回饋重新規劃。"
        else:
            m["demo_rejections"] += 1
            self.state["verify_round"] = self.state.get("verify_round", 0) + 1
            self.add_task("修正 demo 回饋", f"使用者看了 demo 後的回饋：\n\n> {message}")
            self.set_phase("build")
            hint = "已建立修正任務，執行 run 繼續。"
        self.state["awaiting"] = "human" if phase == "spec_review" else None
        self.state["message"] = hint
        self.save()
        print(f"↩️  已退回。{hint}")

    def change(self, message: str) -> None:
        if not self.state.get("spec_hash"):
            sys.exit("SPEC 還沒鎖定，直接用 /elicit 修改即可。")
        with (self.dir / "CHANGE_REQUESTS.md").open("a", encoding="utf-8") as f:
            f.write(f"\n## {now()}｜SPEC v{self.state.get('spec_version')} 之後，於「{PHASE_LABEL[self.phase]}」提出\n\n"
                    f"{message}\n")
        self.state["metrics"]["change_requests"] += 1
        self.state["spec_hash"] = None
        write_fm(self.spec_path(), "status", "drafting")
        self.set_phase("elicit")
        self.state.update(awaiting="human", message="請執行 /elicit 更新 SPEC（只改變更的部分）。")
        self.save()
        print("📝 已記錄變更請求並解鎖 SPEC。請在 Claude Code 執行 /elicit 更新 SPEC，之後重新核准。")

    def status(self) -> None:
        self.save()
        print((self.dir / "STATUS.md").read_text(encoding="utf-8"))

    def metrics(self) -> None:
        m = self.state["metrics"]
        q = read_fm(self.spec_path()).get("questions_asked", "?")
        print(f"訪談提問數        ：{q}")
        print(f"SPEC 被退回次數   ：{m['spec_rejections']}")
        print(f"核准後需求變更次數：{m['change_requests']}   ← 最能反映訪談品質")
        print(f"PLAN 被退回次數   ：{m['plan_rejections']}")
        print(f"demo 被退回次數   ：{m['demo_rejections']}")
        if m["change_requests"] or m["demo_rejections"]:
            print("\n建議：看 .bridge/CHANGE_REQUESTS.md 與 FEEDBACK.md，找出訪談時漏問的類別，"
                  "補進 .claude/skills/elicit/references/ 的「常見盲點」。")

    def sync_profile(self) -> None:
        """把專案內更新過的使用者偏好存回全域正本，下個專案 init 時沿用。"""
        local = self.dir / "USER_PROFILE.md"
        try:
            GLOBAL_PROFILE.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(local, GLOBAL_PROFILE)
        except OSError:
            pass


# ---------- init ----------


def init(target: Path) -> None:
    if not TEMPLATE_DIR.is_dir():
        sys.exit("init 要用範本資料夾裡的 bridge.py 執行（找不到 template/）。")
    target.mkdir(parents=True, exist_ok=True)
    for src in sorted(TEMPLATE_DIR.rglob("*")):
        if src.is_dir():
            continue
        rel = src.relative_to(TEMPLATE_DIR)
        dest = target / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            shutil.copyfile(src, dest)
            continue
        if rel.name in ("AGENTS.md", "CLAUDE.md", "GEMINI.md"):
            first = src.read_text(encoding="utf-8").splitlines()[0]
            if first not in dest.read_text(encoding="utf-8"):
                with dest.open("a", encoding="utf-8") as f:
                    f.write("\n\n" + src.read_text(encoding="utf-8"))
                print(f"  已在既有的 {rel} 末尾加上 bridge 設定")
        elif str(rel) == ".claude/settings.json":
            print(f"  ⚠ 已有 {rel}，沒有覆蓋。請手動合併 hooks 區塊（範本：{src}）")
        else:
            print(f"  保留既有的 {rel}")
    shutil.copyfile(Path(__file__).resolve(), target / ".bridge" / "bridge.py")
    if GLOBAL_PROFILE.exists():
        shutil.copyfile(GLOBAL_PROFILE, target / ".bridge" / "USER_PROFILE.md")
        print(f"  已套用你的全域偏好 {GLOBAL_PROFILE}")
    b = Bridge(target.resolve())
    b.save()
    print(f"\n✅ 已安裝到 {target}")
    if not (target / ".git").exists():
        print("  建議先 `git init`：核准檢查點與每個任務通過審查時會自動 commit，方便回溯。")
    print("  下一步：在這個資料夾開 Claude Code，執行 /elicit")


def find_root() -> Path:
    here = Path.cwd().resolve()
    for d in [here, *here.parents]:
        if (d / ".bridge" / "config.toml").exists():
            return d
    sys.exit("找不到 .bridge/config.toml。請在專案資料夾內執行，或先執行 init。")


def main() -> None:
    ap = argparse.ArgumentParser(description="Claude Code × Antigravity / Gemini 協作 orchestrator")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init", help="把範本裝進專案").add_argument("target", type=Path)
    for name, help_ in [("status", "看目前進度"), ("run", "自動推進，直到需要你介入"),
                        ("approve", "核准目前的檢查點"), ("metrics", "需求品質指標")]:
        sub.add_parser(name, help=help_)
    for name, help_ in [("reject", "退回目前的檢查點"), ("change", "SPEC 鎖定後提出需求變更")]:
        sub.add_parser(name, help=help_).add_argument("-m", "--message", required=True)
    args = ap.parse_args()

    if args.cmd == "init":
        return init(args.target)
    b = Bridge(find_root())
    if args.cmd in ("reject", "change"):
        getattr(b, args.cmd)(args.message)
    else:
        getattr(b, args.cmd)()


if __name__ == "__main__":
    main()
