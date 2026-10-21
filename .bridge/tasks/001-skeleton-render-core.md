---
id: 001
title: 專案骨架、測試環境、場地與物件繪圖核心
owner: claude
status: done
depends_on: []
reviewer: claude
attempts: 0
---

## 目標

建立多檔專案骨架與零依賴測試環境，並把舊版的繪圖純函式（場地、物件、線條）搬成 `js/core/` 模組，用「舊版當參考答案」的 golden test 證明輸出逐字相同。

## 涵蓋的驗收條件

- AC-1（14 種場地繪圖、名稱、分組與舊版相同：golden）
- AC-2（每種物件/線條的外觀與舊版一致：golden）
- AC-11（README 寫明 `python3 -m http.server` 啟動方式；此時尚無頁面，先寫好段落）
- AC-12（結構檢查測試：每檔 ≤ 400 行、core 不碰 DOM）
- AC-13（`npm test` 可執行，不需 `npm install`）

## 實作提示

1. `git mv pe-board.html legacy/pe-board.html`。之後**不得修改** legacy 檔（它是參考答案）。
2. `package.json`：`"type": "module"`、`"engines": {"node": ">=22"}`、`"scripts": {"test": "node --test \"tests/unit/**/*.test.js\""}`，無 dependencies。
3. `.gitignore`：`node_modules/`。
4. 模組（從舊版第 307～518 行、733～744 行搬移，**不改演算法、不改數字格式**）：
   - `js/core/util.js`：`W`、`FONT`、`uid`、`f`、`esc`
   - `js/core/courts.js`：`COURTS`（保持插入順序：決定場地選單的分組與排序）、`scaleOf`、`courtH`、`courtSVG`
   - `js/core/items.js`：`TEAMS`、`INKS`、`ITEMS`、`LINES`、`isLine`、`shape`、`textUnits`、`textHalfW`、`TEXT_MIN/MAX`、`clampSize`、`selR`
   - `js/core/render.js`：`qpt`、`qder`、`itemSVG`、`lineSVG`、`boardContent`、`iconSVG(type, {team, ballColor})`（舊版 iconSVG 讀全域 `ui.team`、`doc.court`，改成參數）
5. `tests/helpers/legacy.js`：讀 `legacy/pe-board.html`，用舊版的註解標記（`/* ---------- Courts`、`/* ---------- State` 等）切出程式碼段落，在 `node:vm` 執行並回傳參考函式。標記找不到時直接 throw。需要時提供假的 `Math.random`（固定種子）讓 uid 可重現。這個 helper 會被 002 擴充（加 Export、Step animation 段落），請寫成可傳入段落名稱的形式。
   - **前導段（plan-critique-1 §2.1）**：`W`、`FONT`、`$`、`uid`、`f`、`esc` 定義在 `(() => {` 與第一個 `/* ---------- Courts` 標記之間（舊版約 306～313 行），不屬於任何具名段落。helper 必須把這段當成固定的 `preamble` 一律先執行，否則 Courts 段會 `ReferenceError`。切段以「`<script>` 內的 `(() => {` 之後」為起點，不要寫死行號。
   - 舊版 `iconSVG`、`exportSVG` 讀閉包中的 `ui`、`doc`：在 vm context 只注入用得到的最小欄位（例如 `{ ui:{team}, doc:{court} }`），不要模擬整個 DOM。若某段需要的假環境超過約 20 行，改為只把該函式的輸出寫成 `tests/fixtures/*.json` 靜態檔（附產生腳本），並在交接筆記說明。
   - 加一個 smoke test：helper 能載入每個用到的段落、回傳的函式都是 function（讓標記問題第一時間以清楚的訊息失敗）。
6. 測試 `tests/unit/`：
   - `render.golden.test.js`：14 種場地的 `courtSVG` 逐字相同；`Object.values(COURTS).map(c=>[c.name,c.group])` 相同；每種 ITEMS/LINES 類型（player 五色、含 1/2/3 字元 label、text 白/黑、zone 有無 label、dribble 長短、曲線/直線）在 `boardContent(court, step, k, hit)` 下 hit=true/false、k=1/1.4 都相同；`iconSVG` 每種類型相同。
   - `structure.test.js`：掃 `js/**/*.js`、`css/**/*.css`（存在才掃）每檔 ≤ 400 行；`js/core/**` 不得出現 `document`、`window`、`localStorage`、`navigator`。比對前先去掉註解（`//…`、`/*…*/`）與字串／樣板字串內容，並以識別字邊界（`\bdocument\b`）比對，避免註解或字串造成誤判（plan-critique-1 §6.2）；附一個反例測試：含這些字眼的註解與字串不應被判違規。
7. `README.md`：專案說明、`python3 -m http.server 8000` 後開 `http://localhost:8000/`、`npm test`（Node ≥ 22）、目錄結構簡述。之後的任務會補充。

## 交接筆記

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->

### 做了什麼（claude，2026-10-21）

- `git mv pe-board.html legacy/pe-board.html`（未修改內容）。
- `package.json`（`type: module`、`engines.node >=22`、`npm test`，無 dependencies）、`.gitignore`。
- `js/core/util.js`、`courts.js`、`items.js`、`render.js`：由腳本按舊版行號（307–312、315–391、394–518、733–744）**原文搬移**，只加 `export`／`import`；唯一改動是 `iconSVG(type, { team = 'red', ballColor } = {})` 改用參數取代閉包的 `ui.team`、`COURTS[doc.court].ball`。`$`（DOM）沒有搬。`courtSVG` 的快取保留。
- `tests/helpers/legacy.js`：從 `<script>` 內 `(() => {` 之後開始，以 `/* ---------- 名稱 ---------- */` 標記切段（名稱去掉括號說明，如 `Courts`、`Template library`、`Step animation`），前導段一律先執行；`loadLegacy(names, { globals, seed })` 在 `node:vm` 執行，`Math.random` 換成固定種子（mulberry32），回傳 Proxy（讀屬性＝在閉包內取同名值）。標記或名稱找不到時 throw 清楚訊息。注入的假環境只有 `document.querySelector`（Rendering 段開頭的 `$('#board')`）與測試傳入的 `{ ui:{team}, doc:{court} }`，不需要靜態 fixture。
- `tests/helpers/strip.js`：`stripCode` 去掉註解、字串、樣板字串文字、正規表示式內容（保留 `${}` 內程式碼與換行）。
- 測試：`legacy-helper.test.js`（smoke）、`render.golden.test.js`、`structure.test.js`（含反例／正例）。
- `README.md`：`python3 -m http.server 8000` 啟動方式、`npm test`、目錄結構。

### 怎麼驗證

- `npm test`（Node v26.3.0）：30 個測試全過。
- golden 涵蓋：14 場地 id／名稱／分組／順序／參數、`courtSVG`／`scaleOf`／`courtH`；TEAMS/INKS/ITEMS/LINES/TEXT_MIN/MAX/clampSize；fixture 含五色＋未知隊伍 × 0–3 字元與數字編號、每種器材 × 多種 rot、球有無顏色、軟墊特殊字元、文字白/黑/大寫 #FFFFFF/預設 × 多種內容與字級、run/pass/dribble × 直線/曲線/近零/零長度/短/長 × 顏色、zone × 顏色 × 有無名稱；逐一比對 `itemSVG`（k=1/1.4/0.6 × hit）、`lineSVG`（hit）、`selR`、`textHalfW`、`qpt`/`qder`，並對 14 場地 × k=1/1.4 × hit 比對 `boardContent`；`iconSVG` 每種類型 × 5 隊 × 14 場地球色。
- 變異測試：把 `shape` 中學生圓圈的 `stroke-width="2.5"` 改成 2.4，golden 有 7 個測試失敗；還原後全過。

### 已知限制

- 建議把 `.bridge/config.toml` 的 `[tests] command` 設為 `npm test`（依規則我不改 orchestrator 設定）。
- `stripCode` 是啟發式（以前一個有效字元判斷 `/` 是否開始正規表示式），對 core 這種一般寫法足夠；極端寫法可能誤判，但只會造成「多刪」而非誤報。
- 頁面尚未存在（003 才建 `index.html`），README 的啟動段落先寫好。

