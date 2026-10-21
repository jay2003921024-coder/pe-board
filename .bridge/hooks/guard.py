#!/usr/bin/env python3
"""Claude Code PreToolUse hook：阻止 agent 修改已鎖定的 SPEC 與 orchestrator 的狀態檔。"""
import json
import os
import sys
from pathlib import Path

try:
    event = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(0)

file_path = (event.get("tool_input") or {}).get("file_path")
if not file_path:
    sys.exit(0)

root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or ".").resolve()
bridge = root / ".bridge"
target = Path(file_path)
if not target.is_absolute():
    target = Path(event.get("cwd") or root) / target
target = target.resolve()

if target in (bridge / "state.json", bridge / "STATUS.md"):
    print("state.json 與 STATUS.md 由 bridge.py 維護，agent 不可直接編輯。", file=sys.stderr)
    sys.exit(2)

if target == bridge / "SPEC.md":
    try:
        state = json.loads((bridge / "state.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        sys.exit(0)
    if state.get("spec_hash"):
        print(
            "SPEC 已核准鎖定，不可修改。若需求有問題，請在任務交接筆記寫明並把任務設為 blocked，"
            "或請使用者執行 `python3 .bridge/bridge.py change -m \"說明\"`。",
            file=sys.stderr,
        )
        sys.exit(2)

sys.exit(0)
