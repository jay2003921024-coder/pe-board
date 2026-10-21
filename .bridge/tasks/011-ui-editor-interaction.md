---
id: 011
title: UI 拆分（一之二）：畫布互動、屬性面板、快捷鍵、動畫播放
owner: claude
status: todo
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

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->
