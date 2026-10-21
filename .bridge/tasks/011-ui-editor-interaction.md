---
id: 011
title: UI 拆分（一之二）：畫布互動、屬性面板、快捷鍵、動畫播放
owner: claude
status: done
depends_on: [003]
reviewer: claude
attempts: 0
---

## 目標

在 003 的外殼與狀態中心之上，補齊編輯互動：畫布 pointer 操作（放置、選取、拖曳、框選、線條端點與控制點把手）、屬性面板、所有鍵盤快捷鍵、步驟間動畫播放，行為與舊版完全相同。

（plan-critique-1 §3.1：原 003 拆出的後半段。編號用 011 是為了不重排既有任務；執行順序由 `depends_on` 決定：003 → 011 → 004。）

## 涵蓋的驗收條件

- AC-2（每種工具放置、選取、移動、刪除）
- AC-3（V/S/T/C/B/X/R/P/D/Z、Ctrl+Z、Ctrl+Shift+Z、Ctrl+Y、Ctrl+D、Ctrl+A、Esc、Delete/Backspace、方向鍵、`[` `]`）
- AC-4（播放動畫、0.5×/1×/2×）
- AC-12（每檔 ≤ 400 行）

## 實作提示

- 只 import `js/ui/state.js` 與 `js/core/*`，不 import 其他 UI 模組；由 `main.js` 呼叫各模組的 init。
- `js/ui/editor.js`（pointer 事件，舊版 845～949）、`js/ui/props.js`（renderProps、屬性事件、deleteSel、dupSel）、`js/ui/keyboard.js`（1038～1061）、`js/ui/player.js`（animFrame、startAnim、stopAnim、caption、composite，用 core/anim）。
- 細節要保留：拖曳開始才 pushUndo、太短的新線條移除並撤銷 undo（`history.popLast()`）、Esc 先關 modal、輸入框中不觸發快捷鍵、文字物件編輯走 `textEdit`（typingUndo）。
- 若需要改 003 建立的 `state.js`／`board.js`，只做新增（掛勾、匯出函式），不改既有行為，並在交接筆記列出。
- 驗證：Chrome 開 `http://localhost:8000/` 與 `legacy/pe-board.html` 並排，逐一操作 AC-2（每種工具）、AC-3（每個快捷鍵）、AC-4（3 步教案播放三種速度）；`npm test` 全過。

## 交接筆記

**做了什麼**

新增 4 個 UI 模組，逐字搬移舊版對應段落的行為，只把全域變數換成 `state.js` 的 `state`／`hooks`：

- `js/ui/editor.js`（124 行）：畫布 pointer 互動（舊版 845～949）。放置新物件／新線條、單選、Shift 加減選、拖曳移動、框選、線條端點與控制點把手（含文字物件的字級把手 `ts`）、太短的新線條在 `pointerup` 時移除並用 `history.popLast()` 取消剛才的 undo 快照、雙擊讓 `#propLabel` 取得焦點並全選。
- `js/ui/props.js`（106 行）：屬性面板（舊版 779～1001）。單選/多選欄位、隊伍與顏色色票、字級拖桿與 `A−`/`A+`、路線種類切換、拉直／反轉、旋轉、複製（`dupSel`）／刪除（`deleteSel`）。`propLabel`／字級輸入走 `textEdit`（同一次聚焦只記一筆復原）。
- `js/ui/keyboard.js`（43 行）：全部快捷鍵（舊版 1038～1060）：`V/S/T/C/B/X/R/P/D/Z`、`Ctrl+Z`、`Ctrl+Shift+Z`、`Ctrl+Y`、`Ctrl+D`、`Ctrl+A`、`Esc`（先關開著的 `.modal`，沒有才清選取並切回選取工具）、`Delete`/`Backspace`、方向鍵（持續按不重覆 push undo）、`[`/`]`（文字字級）。輸入框／textarea／select 中不觸發（除 `type=range`）。
- `js/ui/player.js`（76 行）：動畫播放（舊版 1063～1172）。`composite`／`caption`／`animFrame`／`startAnim`／`stopAnim`，配對與緩動邏輯用既有 `core/anim.js`（`planTransition`／`posAt`／`ease`）。播放中切步驟分頁會同步 `doc.cur` 並呼叫 `hooks.renderSteps()`，結束時 `hooks.syncInputs()` + `renderAll()`（與舊版一致）。

跨模組呼叫一律經由 `hooks`（`js/ui/state.js` 新增 `setTool`／`deleteSel`／`dupSel` 三個掛勾，預設 noop）：

- `toolbar.js`（`initToolbar`）新增一行 `hooks.setTool = setTool`（只新增，沒改既有行為）。
- `props.js`／`player.js` 的 init 各自掛上 `hooks.deleteSel`／`hooks.dupSel`／`hooks.renderProps`／`hooks.stopAnim`。
- `editor.js`／`keyboard.js` 都只 import `state.js` 與 `core/*`；`keyboard.js` 的 `KEYS` 快捷鍵對照表與 `toolbar.js` 重複一份（兩者都是純常數、沒有狀態），避免 import 其他 UI 模組造成耦合。
- `main.js` 的 `inits` 陣列新增 `initEditor, initProps, initKeyboard, initPlayer`（接在既有三個之後）。

**怎麼驗證**

- `npm test`：119 個測試全過，含「`js/` 每檔 ≤ 400 行」「`js/core` 不碰 document/window/localStorage」等結構測試（本次新檔都在 `js/ui/`，不受後者限制；行數：editor 124、props 106、keyboard 43、player 76，皆遠低於 400）。
- `node --check` 確認 4 個新檔與改動的 `state.js`／`toolbar.js`／`main.js` 語法正確。
- 程式碼逐行比對舊版對應行號（845～949、779～1001、1038～1060、1063～1172），確認搬移時只做了「全域變數→`state.*`／`hooks.*`」的替換，沒有改變邏輯或順序。

**已知限制**

- 本機沒有瀏覽器自動化工具可用，**沒有**在真實瀏覽器中逐一操作 AC-2／AC-3／AC-4 比對 `legacy/pe-board.html`；只靠上述程式碼比對與既有單元測試把關。建議下一個環節（e2e／antigravity_ide 或使用者）依任務檔的驗證步驟，用 `python3 -m http.server` 開 `index.html` 與 `legacy/pe-board.html` 並排手動核對一次。
- `Esc` 關閉 modal 的實作是直接把所有 `.modal` 設為 `hidden = true`，沒有呼叫（也還不存在的）`closeModals()`；004 任務加入匯出/範本庫 modal 的開關邏輯時，若有額外的關閉副作用（例如清空匯入檔案輸入），需要自行處理，這裡只保證「按 Esc 能把開著的 modal 關掉」這個行為與舊版一致。
- 004 會新增 `#btnTemplates`／`#btnSaveTpl`／`#btnExport` 等按鈕的行為，本任務沒有碰。
