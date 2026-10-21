---
id: 003
title: UI 拆分（一）：外殼、CSS、狀態中心、畫布渲染、工具列、步驟、本機儲存
owner: claude
status: done
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

### 做了什麼

- `index.html`：舊版 189～303 行 HTML 原樣搬入（class、id 不變），head 加上 3 個 CSS 與 `<script type="module" src="js/main.js">`。**新增 `<!doctype html>`、`<html lang="zh-Hant">`**：舊版沒有 doctype（直接開檔是 quirks mode），舊版註解說明 Claude 頁面外殼本來就會補上；截圖比對版面與舊版一致。
- `css/base.css`（舊版 10～34、186 行）、`css/layout.css`（36～121、170～185）、`css/modals.css`（124～168）：用 `sed` 依行號切出，內容逐字不變。layout 的 RWD media query 移到 modals 之前載入，兩者沒有重疊的選擇器，cascade 結果相同。
- `js/store/local.js`：`KEY`、`loadDoc()`（`parseSavedDoc`，try/catch）、`saveDoc(doc)`。
- `js/ui/state.js`、`board.js`、`toolbar.js`、`steps.js`、`js/main.js`：照舊版搬移，不改寫邏輯。
- 選取物件面板（`#props`）在本任務是空的：`renderProps` 屬於 011。範本庫、存成範本、匯出、播放動畫按鈕目前點了沒有反應（004／011）。

### state.js 公開介面（給 011／004／005／008）

- `$`、`state = { doc, ui:{tool,team,ink,sel,sels}, drag, anim }`：`state.doc` 會在 `restore` 時被換成新物件，**一律用 `state.doc` 讀取，不要把 doc 存成區域變數**。
- `history`（core `createHistory`，上限 80；拖曳畫線太短時用 `history.popLast()` 後再呼叫 `updateHistory()`）。
- 選取：`step()`、`findObj(id)`、`getSel()`、`selIds()`、`selObjs()`、`setSelection(ids)`、`selectOne(id)`、`clearSel()`。
- 編輯：`save()`、`pushUndo()`、`restore(json)`、`doUndo()`、`doRedo()`、`updateHistory()`、`mutate(fn)`（stopAnim→pushUndo→fn→renderAll→save）、`textEdit(fn)`（typingUndo：`focusin` 到 input/textarea 時重設）、`renderAll()`（renderBoard→renderSteps→renderProps→renderHint→updateHistory）。
- `hooks`：`renderBoard`、`renderSteps`、`renderProps`、`renderHint`、`renderTools`、`syncInputs`、`stopAnim`，預設 no-op，由各模組 init 時填入。011 要填 `hooks.renderProps`（props.js）與 `hooks.stopAnim`（player.js）；需要新的跨模組呼叫（例如 004 的 `closeModals`）就在 `hooks` 加一個預設 no-op 的欄位。
- `initState(doc)`：main.js 開機時呼叫。
- 其他模組匯出：`board.js` 的 `renderBoard`、`overlay`、`ring`、`handleR`；`toolbar.js` 的 `iconSVG(type)`（帶入目前隊伍與球色）、`KEYS`、`HINTS`、`renderTools`、`renderHint`、`setTool`；`steps.js` 的 `renderSteps`、`syncInputs`。依計畫，011 的模組只 import state 與 core，需要 `setTool` 等請透過 hooks 或由 main.js 傳入。
- `main.js` 的 `inits` 陣列是後續任務掛 init 的地方；開機順序：`initState(loadDoc() || 第一個內建範本)` → 各 init → `syncInputs`、`renderTools`、`renderAll`（同舊版 Boot）。

### 怎麼驗證

- `npm test`：89 個測試全過（含結構測試：每檔 ≤ 400 行；新增檔案最大 77 行）。
- headless Chrome（CDP 腳本，`python3 -m http.server`）在同一個 origin 先後開 `legacy/pe-board.html` 與 `/`，兩邊都從同一份 `pe-board-v1` 開機（舊版寫入，對應 AC-6），跑同一串操作，比對 31 份 DOM 快照（`#board` outerHTML、`#steps`、`#stepCount`、`#tools`、`#hint`、所有輸入欄位值、復原/重做/刪除步驟/播放按鈕的 disabled 與 title）以及最後存下的 localStorage（步驟 id 遮罩）：**全部逐字相同**。操作包含：場地選單 optgroup（AC-1）、依序切換 14 種場地、連按 14 次復原、重做、新增步驟（焦點落在步驟名稱）、改步驟名稱與說明、切換步驟分頁、刪除步驟後復原、清空畫面、改教案資訊／年段／圖示大小、選隊伍色（自動切到學生工具）、選線條色、切換工具（AC-4 步驟部分）。
- 重新整理後教案還在；清空 localStorage 後開機會開「三人傳切上籃」；模擬 `prefers-color-scheme: dark` 後 body 背景是 `#10171a`、文字是 `#e4ebe9`（AC-9）；新版頁面沒有 console error。
- 1400×900 截圖與舊版並排比對：版面相同，只差右上「選取的物件」卡片內容（011）。

### 已知限制

- 畫布 pointer 互動、屬性面板、鍵盤快捷鍵、動畫播放尚未搬移（011）；匯出、範本庫、存成範本、modal 關閉（004）。
- 驗證用的 CDP 腳本放在 session scratchpad，沒有進 repo（計畫明定不引入瀏覽器測試依賴）。
