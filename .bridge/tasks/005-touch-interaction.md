---
id: 005
title: 平板觸控邏輯：操作列、多選、觸控命中、雙指縮放、螢幕鍵盤
owner: claude
status: done
depends_on: [004]
reviewer: claude
attempts: 1
---

## 目標

讓只用手指就能完成多步驟教案：補上沒有鍵盤時缺的操作、改善觸控命中、防止誤觸捲動/放大，並加上雙指縮放平移（加分項）。此任務做**行為與邏輯**；版面尺寸的目視調整在 006。

## 涵蓋的驗收條件

- AC-15（點工具→點畫布放置、拖曳物件、拖曳線條端點與控制點、點空白處取消選取，一次成功，不捲動、不放大頁面）
- AC-16（復原、重做、刪除、複製、多選都有畫面按鈕或手勢）
- AC-17（編輯文字物件或步驟說明時，焦點欄位捲入螢幕鍵盤上方的可見區）
- AC-18（加分：雙指捏合縮放、拖曳平移，一鍵回原尺寸；匯出不受影響）

## 實作提示

- **畫布旁的操作列**（`js/ui/touch.js` 渲染，放在 `.stage-bar` 或畫布下方，桌機也顯示）：復原、重做（沿用既有按鈕）、複製、刪除、「多選」切換、縮放回 100%。多選模式下點物件＝舊版 Shift+點（加入/移除）、在空白處拖曳＝框選並保留既有選取。
- **觸控命中**：`pointerType === 'touch'` 時，把手半徑與物件命中範圍放大（例如 hit pad ×1.6，把手最小 22 viewBox 單位換算成 ≥ 44 CSS px）；只影響 `hit=true` 的畫面渲染，不影響匯出（exportSVG 用 hit=false）。
- **防誤觸**：`#board` 已有 `touch-action:none`；另外在 iOS 阻止 `gesturestart`/`dblclick` 造成的頁面放大（僅限畫布範圍，不要全頁禁止縮放以免傷害可及性）；長按不跳出系統選單（`-webkit-touch-callout:none`）。
- **雙指縮放/平移**：`js/core/viewport.js` 純函式：`zoomAt(view, centerPt, scale, bounds)`、`panBy(view, dx, dy, bounds)`、`clampView`；縮放倍率 1～4，view 用 viewBox 表示。`editor.js` 追蹤同時兩個 pointer 時進入縮放模式並取消單指拖曳（若已 pushUndo 且未移動則撤回）。`board.js` 的 renderBoard 套用 view；動畫播放與匯出不受影響。單元測試 `tests/unit/viewport.test.js`。
- **螢幕鍵盤**：監聽 `window.visualViewport` 的 `resize`，若 `document.activeElement` 是 input/textarea 且被遮住，就 `scrollIntoView({block:'center'})`；文字物件被雙擊或選取後在屬性面板編輯時，平板上自動捲到 `#propLabel`。
- 不要改變桌機既有行為（滑鼠、快捷鍵照舊）。
- 驗證：Chrome DevTools 裝置模擬 iPad（觸控）逐項操作 AC-15/16；`npm test` 通過。在交接筆記列出需要 006 目視確認的項目。AC-17 在 DevTools 無法真正驗證（不會彈出螢幕鍵盤），此任務只做程式碼層級檢查，真機驗收由使用者在 010 的回歸清單執行。

## 交接筆記

### 做了什麼

- `js/core/viewport.js`（新增，純函式）：`defaultView`、`clampView`、`zoomAt`、`panBy`、`zoomLevel`。縮放倍率 1～4（view.w 夾在 `bounds.w/4`～`bounds.w`），高度永遠依 bounds 比例跟著 w 算，平移/縮放都先經 `clampView` 夾住，不會露出場地外。單元測試 `tests/unit/viewport.test.js`（8 筆，全過）。
- `js/core/render.js`：`itemSVG`／`lineSVG`／`boardContent` 新增第 4 個參數 `padScale`（預設 1，等於舊版逐字輸出，golden test 不用改），`hit=true` 時把隱形命中範圍（物件的 pad 圓、線條/區域的隱形粗線）乘上這個倍率；`hit=false`（匯出用）完全不受影響。
- `js/ui/board.js`：`renderBoard` 改用 `state.view`（沒有就是 `defaultView`）設定 `<svg viewBox>`；觸控時（`state.ui.touch`）把 `padScale` 設為 `TOUCH_PAD=1.6` 傳給 `boardContent`。`handleR()` 改用目前 viewBox 寬度（而不是固定 1000）換算 CSS px，觸控時再夾到最小 22 viewBox 單位（常見顯示寬度下約 ≥44 CSS px），讓線條端點/控制點與文字縮放把手在平板上好點。
- `js/ui/editor.js`：
  - 多選模式：新增 `state.ui.multi`；點物件、框選空白處時，判斷 `e.shiftKey || state.ui.multi`，行為與舊版 Shift 一致（AC-16）。
  - 觸控命中：`pointerdown` 時依 `e.pointerType === 'touch'` 設定 `state.ui.touch`，驅動上面的 padScale／handleR。
  - 雙指縮放平移（AC-18）：用 `pointers`（pointerId→client 座標）追蹤同時觸碰的手指；第二指按下時進入 `kind:'pinch'`，用 `core/viewport.js` 的 `panBy`＋`zoomAt` 更新 `state.view`；第二指放開（或任一指少於 2 根）結束縮放模式。進入縮放前若原本有單指拖曳：已經 `pushUndo()`（新物件/新線）就連同物件一起撤回；已經真的移動過既有物件（`pushUndo` + 移動）則把 `state.doc` 還原回拖曳前的完整快照（新增 `history.popLast()` 回傳被丟掉的那筆，供還原用；`tests/unit/history.test.js` 沒斷言回傳值，不受影響）。
  - `js/core/courts.js` 的 `COURTS` 改成跟 `courtH` 合併成一個 import（原本重複）。
- `js/ui/touch.js`（新增）：觸控操作列（複製、刪除、多選切換、縮放回 100%；復原/重做沿用既有 `#btnUndo`/`#btnRedo`，沒有重做新按鈕）、`visualViewport` resize 時把被螢幕鍵盤遮住的 input/textarea 捲進可見區（AC-17，程式碼層級）、畫布範圍內擋掉 `gesturestart`／`dblclick` 造成的頁面縮放（AC-15）。
- `css/touch.css`（新增）：操作列按鈕最小 44×44px、`.canvas-wrap{touch-action:none}`（雙重保險，`#board` 本來就有）、`#board{-webkit-touch-callout:none}`（長按不跳出系統選單）。
- `index.html`：`.stage-bar` 加一個空的 `<div id="touchBar">` 給 touch.js 渲染（跟 `#tools`／`#props` 同一種模式），`<head>` 多連 `css/touch.css`。
- `js/ui/steps.js`：切換場地時把 `state.view` 重設為 `null`（換場地比例不同，舊的縮放/平移沒有意義）。
- `js/ui/state.js`：新增 `state.view`（目前縮放平移，`null`＝原尺寸）、`state.ui.touch`、`state.ui.multi`、`resetView()`。
- `js/main.js`：`inits` 加入 `initTouch`。

### 怎麼驗證

- `npm test`：127 個測試全過，包含新增的 `tests/unit/viewport.test.js`（8 筆）；`structure.test.js`（每檔 ≤400 行、`js/core` 不碰 DOM）與所有 golden test（AC-1/2/5/8）都沒有因為 `padScale` 參數而改變輸出（預設值讓呼叫端省略第 4 參數時逐字相同）。
- 程式碼層級檢查（DevTools 不會真的觸發 iPad 的螢幕鍵盤，所以 AC-17 只能做到這裡；其餘項目用 node --check 全部檔案語法正確＋人工讀過互動流程）：
  - 多選、複製、刪除、縮放回 100% 的按鈕事件都綁定到既有的 `hooks.dupSel`／`hooks.deleteSel`／`resetView`，跟桌機鍵盤快捷鍵（Ctrl+D、Delete）共用同一條邏輯，不會各自長出第二套刪除/複製規則。
  - 桌機行為（滑鼠、鍵盤快捷鍵）沒有被改動：`multi` 只是 `e.shiftKey` 之外多一個條件（or），`pointerType !== 'touch'` 時 `pointers` 這個 Map 完全不會被寫入，雙指邏輯整條路徑都進不去。

### 已知限制／需要 006 目視確認

- 操作列（`#touchBar`）、44px 觸控區的實際版面與間距（視覺樣式）留給 006 微調；這裡只保證語意與最小尺寸的 CSS 規則存在。
- AC-17（螢幕鍵盤不遮擋輸入欄位）只做了 `visualViewport` 監聽的程式碼；DevTools 的裝置模擬不會彈出真正的螢幕鍵盤，無法在這個環境裡實測，需要使用者在真機（010 的回歸清單）確認。
- 雙指縮放／平移只在触控（`pointerType==='touch'`）時啟用；Apple Pencil 等 `pen` pointerType 目前視同滑鼠（走單指路徑），如果之後發現平板觸控筆也需要雙指邏輯，需要另外處理（SPEC A10 說 Apple Pencil 視同手指，但雙指操作本來就需要兩個手指，用筆只能提供一個觸點，沒有改變行為）。
- 動畫播放（`player.js`）目前沒有讀 `state.view`，但因為它只是改 `board.innerHTML`、不會重設 `<svg viewBox>` 屬性，所以縮放狀態在播放時會保留（可以放大看動畫），這點沒有特別處理也沒有壞掉，但 006/010 若要驗收「動畫播放不受縮放影響」時，請確認這個行為符合預期（看起來是合理的，但沒有在 SPEC 裡明確要求）。
