---
id: 005
title: 平板觸控邏輯：操作列、多選、觸控命中、雙指縮放、螢幕鍵盤
owner: claude
status: todo
depends_on: [004]
reviewer: antigravity
attempts: 0
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

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->
