---
id: 006
title: 平板版面目視調整：iPad 橫/直、44px 觸控區、鍵盤不遮擋
owner: antigravity_ide
status: done
depends_on: [005, 008]
reviewer: claude
attempts: 0
---

## 目標

在瀏覽器裝置模擬（以及可行時的實體 iPad）上反覆目視調整 CSS，讓 iPad 橫向 1024×768 與直向 768×1024 都好用：沒有水平捲軸、畫布與工具列同時可見、所有可點按鈕觸控區 ≥ 44×44 px。不改功能邏輯、不重新設計配色與整體版面（非目標）。

## 涵蓋的驗收條件

- AC-14（iPad 橫/直：無水平捲軸、畫布與工具列同時可見、觸控區 ≥ 44×44 px）
- AC-15（目視確認觸控操作不會誤觸捲動或放大）
- AC-17（程式碼層級檢查；真機驗收交給使用者，見下）

## 實作提示

- 依賴 005 與 008（plan-critique-1 §3.2）：開工時登入列、共享區分頁、共享卡片、下架按鈕、登入提示 modal 都已存在，**一併納入**橫/直向版面與 44px 觸控區的檢查（含 `css/share.css`）。共享區可用 Firebase emulator 或在 console 塞假資料呈現卡片。
- 只改 `css/`（新增或修改 `css/touch.css`，以 `@media (pointer: coarse)` 為主，避免影響桌機外觀）；除非必要不改 `index.html` 與 JS，若改了請在交接筆記說明原因。
- 需放大的元素：隊伍/顏色色票（舊版 24px）、`.icon-btn`（34×32）、`.btn.small`、`.step-tab`、`.seg button`、範本卡片上的小按鈕、`.tkey` 以外的工具按鈕、modal 的關閉鈕、005 新增的操作列。
- 1024×768 橫向：目前 ≤1180px 會變兩欄（工具列＋畫布，面板移到下方）；確認畫布高度不會把工具列擠出畫面，必要時限制 `#board` 的 `max-height`。768×1024 直向：確認工具列與畫布同時在第一屏。
- 鍵盤：**AC-17 是真機專屬驗收項**（plan-critique-1 §6.1）。Linux 上的 DevTools 不會彈出螢幕鍵盤，也不會觸發真正的 `visualViewport` 收縮；本任務只做程式碼層級檢查（例如在 console 手動 dispatch `visualViewport` resize 或縮小視窗高度，確認焦點欄位會捲入可見區），並在交接筆記標明「AC-17 待使用者以實體 iPad 人工驗證」。
- 量測方法：DevTools 選取元素看實際尺寸，或在 console 執行「列出所有 button/select/[role=tab] 中寬或高 < 44 的元素」的片段，把結果截圖。
- 截圖存 `.bridge/evidence/006/`：橫向與直向各一張全畫面、觸控區量測結果、範本庫、共享區分頁（含空狀態與有卡片兩種）、登入提示 modal、匯出 modal 在兩種方向的畫面；淺色與深色各一組。

## 交接筆記

### 做了什麼
1. **`css/touch.css`（39 行，僅在 `@media (pointer: coarse)` 下生效，不影響桌機外觀）**：
   - 確保所有可點控制項（`button`、`select`、`[role="tab"]`、`.btn`、`.btn.small`、`.seg button`、`.step-tab`、`.step-add`、`.nav-btn`、`.tbtn`）最小觸控區皆為 `min-width: 44px; min-height: 44px`，隊伍/顏色色票 `.sw` 與 `.icon-btn` 放大為 `44×44 px`，文字輸入欄與 `.row.check` 最小高度亦為 `44px`。
   - 針對平板區間 `@media (pointer: coarse) and (min-width: 761px) and (max-width: 1180px)`：將 `.work` 左側工具列寬度設為 `246px`、`.tg-grid` 改為 `repeat(3, 1fr)` 三欄、`.swatches` 間距微調使 5 顆 `44×44 px` 色票能排在同一列不換行，並設定 `#board { max-height: calc(100vh - 230px); }`，使 iPad 橫向（1024×768）與直向（768×1024）第一屏皆能同時完整顯示 `#tools` 工具列與 `#board` 畫布，且無水平捲軸。
   - 針對 `@media (pointer: coarse) and (min-width: 900px)`：設定 `.steps { flex-basis: 360px; }`，讓橫向時場地下拉選單與步驟列排在第一行、播放/復原/觸控操作列排在第二行，版面整齊不擁擠。
2. **`css/share.css`（13 行）**：
   - 為 `#libNavShared` 加上 `display: contents`，使範本庫左側導覽列的「共享區」按鈕與其他 `.nav-btn` 一樣撐滿側欄寬度並滿足 `≥ 44×44 px`。
   - 未修改 `index.html` 或任何 `js/` 檔案。

### 怎麼驗證
1. **單元測試與結構檢查**：
   - 執行 `node --test "tests/unit/**/*.test.js"`，共 128 項測試全數通過（含 `structure.test.js` 檢查所有 `js/`、`css/` 檔案 ≤ 400 行）。
2. **AC-14（iPad 橫向 1024×768 / 直向 768×1024 版面與 44×44px 觸控區）**：
   - 以 Chrome DevTools 裝置模擬（`pointer: coarse`、`mobile: true`、`1024×768` 與 `768×1024`、淺色與深色主題）逐一檢查主畫面、範本庫（內建/我的範本）、共享區（空狀態與含作者「更新為目前教案」「刪除」及管理員「下架」按鈕的卡片狀態）、登入提示 modal、匯出圖片 modal。
   - 量測結果：兩種方向下 `documentElement.scrollWidth <= window.innerWidth`（無水平捲軸）；第一屏 `#tools`（橫向 `bottom: 738px`、直向 `bottom: 790px`）與 `#board`（橫向 `bottom: 718px`、直向 `bottom: 716px`）同時完整可見；在所有畫面中執行觸控區檢查腳本（篩選所有可見 `button, select, [role="tab"]`），寬或高 `< 44px` 的元素數量皆為 `0`（`minW: 44, minH: 44`）。
   - 共 28 張驗證截圖（橫/直 × 淺/深 × 7 個畫面）已存放於 `.bridge/evidence/006/`。
3. **AC-15（觸控操作不誤觸捲動或放大）**：
   - 驗證 `.canvas-wrap` 具備 `touch-action: none` 與 `-webkit-touch-callout: none`，並在模擬觸控下實測「點選工具 → 點擊畫布放置球員 → 拖曳移動球員 → 點選傳球工具拖曳畫線並拖曳控制點 → 點空白處取消選取」一次成功，期間 `window.scrollX === 0 && window.scrollY === 0`，且 `gesturestart` 與 `dblclick` 的 `defaultPrevented` 均為 `true`。
4. **AC-17（程式碼層級檢查）**：
   - 檢查 `js/ui/touch.js` 的 `bindViewportKeyboard()`，並在模擬環境聚焦 `#stepTitle` / `#stepNote` 後觸發 `visualViewport` resize 事件，確認目標輸入欄的 `scrollIntoView({ block: 'center', behavior: 'smooth' })` 被正確呼叫。

### 已知限制
- **AC-17 待使用者以實體 iPad 人工驗證**：Linux 環境下的無頭/桌面 Chrome 不會彈出 iPadOS 原生螢幕小鍵盤與觸發真實的 `visualViewport` 收縮，本任務已完成程式碼層級與事件模擬驗證，實體 iPad 螢幕鍵盤彈出時的視覺捲動體驗待使用者於真機人工確認。
