---
id: 001
title: 專案骨架、測試環境、場地與物件繪圖核心
owner: claude
status: todo
depends_on: []
reviewer: antigravity
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
