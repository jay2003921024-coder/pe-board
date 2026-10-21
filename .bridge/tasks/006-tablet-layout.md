---
id: 006
title: 平板版面目視調整：iPad 橫/直、44px 觸控區、鍵盤不遮擋
owner: antigravity_ide
status: todo
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

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->
