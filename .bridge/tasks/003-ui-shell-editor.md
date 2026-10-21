---
id: 003
title: UI 拆分（一）：外殼、CSS、狀態中心、畫布渲染、工具列、步驟、本機儲存
owner: claude
status: todo
depends_on: [002]
reviewer: claude
attempts: 0
---

## 目標

建立 `index.html` 與 `css/`、`js/main.js`、`js/ui/` 的外殼與「看得到」的部分：新版在 `python3 -m http.server` 下能開機、讀回舊教案、正確繪出場地與物件、切換場地與步驟、編輯步驟名稱與說明，與舊版相同。畫布 pointer 互動、屬性面板、快捷鍵、動畫播放在 011 做；範本庫、存成範本、匯出在 004 做（此任務先保留按鈕，點了可暫時無動作）。

（plan-critique-1 §3.1：原 003 拆成 003 與 011。）

## 涵蓋的驗收條件

- AC-1（場地選單分組與切換，14 種場地正確繪出）
- AC-4（新增/切換/刪除步驟、編輯步驟名稱與活動說明；動畫播放在 011）
- AC-6（開機讀 `pe-board-v1`，無資料時開第一個內建範本）
- AC-9（深色模式 CSS 變數照搬）
- AC-12（每檔 ≤ 400 行）

## 實作提示

- **搬移不改寫**：舊版 189～303 行 HTML → `index.html`（`<script type="module" src="js/main.js">`）；8～186 行 CSS 拆成 `css/base.css`（變數、深色、reset）、`css/layout.css`（工作台、工具列、舞台、面板、RWD）、`css/modals.css`。版面、class、id 不變。
- `js/store/local.js`：`loadDoc()`、`saveDoc(doc)`，key 固定 `pe-board-v1`，try/catch 同舊版。
- `js/ui/state.js`：`state = { doc, ui:{tool,team,ink,sel,sels}, drag, anim }`、history（用 core/history）、`step()`、`findObj`、選取函式（舊版 666～680）、`pushUndo`、`restore`、`doUndo/doRedo`、`mutate(fn)`、`save()`、`textEdit(fn)`（typingUndo 機制 971～973）、`renderAll()` 透過註冊的 render 函式呼叫，避免 UI 模組互相 import。**011 會在此之上掛互動，state 的公開介面請在交接筆記列出。**
- `js/ui/board.js`（renderBoard、ring、overlay、handleR；選取框與把手的繪製也在這裡，互動在 011）、`js/ui/toolbar.js`（renderTools、setTool、HINTS、隊伍/顏色色票）、`js/ui/steps.js`（renderSteps、步驟事件、syncInputs、教案資訊欄位、場地切換 1010～1017）。
- `js/main.js`：開機順序同舊版 1599 行之後（讀 doc → 綁定 → renderAll）；保留給 011/004/005/008 掛載的初始化點（例如 `initX(state)` 清單）。
- 細節要保留：新增步驟保留物件 id 並去掉路線、`resize` 時重畫選取把手。
- 驗證：在 Chrome 開 `http://localhost:8000/` 與 `legacy/pe-board.html` 並排：切換 14 種場地、開第一個內建範本、步驟新增/切換/刪除/改名/改說明、重新整理後教案還在、系統切深色模式；`npm test` 全過（含結構測試）。若有 headless 瀏覽器可用，至少確認頁面無 console error。

## 交接筆記

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->
