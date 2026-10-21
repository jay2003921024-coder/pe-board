---
id: 008
title: 登入列與共享區 UI、我的範本雲端同步
owner: claude
status: todo
depends_on: [004, 007]
reviewer: antigravity
attempts: 0
---

## 目標

把 007 的後端接到畫面：頂端登入列、範本庫「共享區」分頁（瀏覽、搜尋、預覽、套用、發布、修改/刪除自己的、管理員下架）、登入後「我的範本」改存雲端並在首次登入自動上傳本機範本。離線或未設定 Firebase 時，其他功能照常並顯示提示。

## 涵蓋的驗收條件

- AC-19（未登入可瀏覽、依名稱搜尋、預覽、套用共享範本）
- AC-9（新增的登入列與共享區 UI 在深色模式下文字可讀）
- AC-20（未登入按「發布到共享區」→ 提示需要 Google 登入；登入後回到原畫面，教案不遺失）
- AC-21（登入最多 2 次點擊；頂端顯示使用者名稱與「登出」）
- AC-22（發布後不重新整理；顯示作者名稱與發布時間）
- AC-23（作者可修改/刪除自己的；共享區同步更新）
- AC-24（管理員看得到「下架」，非管理員看不到）
- AC-26（共享區空的時候：說明文字＋內建範本入口＋「發布第一個範本」）
- AC-27（連不到時共享區顯示「暫時連不到共享區」，其他功能照常）
- AC-28（登入後我的範本存雲端、跨裝置；首次登入自動上傳本機範本，本機副本保留）
- AC-29（加分：依場地篩選、「載入更多」分頁）

## 實作提示

- `js/ui/auth.js`：頂端列（`index.html` header）加入「登入」按鈕；按下直接呼叫 `signIn()`（同一個 click 中同步呼叫，避免 popup 被擋）；登入後顯示 `displayName` 與「登出」。Firebase 尚未載入完成時按鈕顯示載入中；未設定/離線時隱藏或停用並給 title 提示。
- `main.js` 在畫布第一次渲染後以不阻塞方式呼叫 007 的 `initFirebase()`（轉址登入回來時自動恢復登入狀態，見 007）。
- **發布入口**（plan-critique-1 §1.2）共三處，都走同一個 `startPublish(source)`：
  1. 範本庫「共享區」分頁上方的「發布目前教案」按鈕（主要入口，對應 AC-20：使用者正在畫布上編輯時直接發布，不必先存成範本）；
  2. 「我的範本」卡片上的「發布到共享區」；
  3. 「存成範本」完成後 toast／modal 中的「也發布到共享區」。
  `source` 為 `{kind:'current'}` 或 `{kind:'mine', tplId}`。發布「目前教案」時，以按下當下的 `tplFromDoc(doc)` 快照為內容，名稱沿用教案標題，可在確認對話框中修改。
- **未登入時的保護**：按發布 → 小 modal：「發布需要 Google 登入」＋登入按鈕。按下前先 `save()`（教案寫入 `pe-board-v1`），再呼叫 `signIn({resumeIntent: source})`。
  - popup 成功：關閉提示，直接開啟發布確認對話框。
  - 退回 redirect：頁面重新載入後，教案由 `pe-board-v1` 讀回（同一般開機），`initFirebase()` 交回 `resumeIntent` → 自動開啟範本庫共享區並彈出發布確認對話框。
  - 驗證兩種路徑都不遺失正在編輯的教案（redirect 可在桌機強制呼叫 redirect 模擬）。
- 發布前確認「範本會公開給所有人，顯示你的 Google 名稱」（A7）。
- `js/ui/sharearea.js`：共享區分頁的列表（縮圖沿用 `thumb`）、名稱搜尋、場地篩選、作者與發布時間（`YYYY/MM/DD HH:mm`）、「開啟」「存到我的範本」；作者本人有「更新為目前教案」「刪除」；`isAdmin` 時每張卡片有「下架」（用既有 `armDanger` 二次確認）。每次打開分頁重新抓第一頁（AC-22 的 10 秒內可見）。
- 空狀態（AC-26）：說明共享區是什麼＋內建範本卡片（或「看內建範本」按鈕）＋「發布第一個範本」按鈕（未登入時走登入提示）。
- 離線（AC-27）：`getFirebase()` 回 null 或請求失敗 → 共享區顯示「暫時連不到共享區」＋重試按鈕；畫圖、匯出、我的範本（本機）、檔案匯入匯出不受影響。
- 我的範本雲端化（AC-28）：在 004 的 `library-store.js` 加雲端實作；`onUser` 登入時切換到雲端，第一次（`users/{uid}` 無 `migratedAt` 或 localStorage 旗標）執行 `planFirstUpload` 上傳本機範本，資料夾用 `planFolderMerge(local, cloud)` 合併後寫回（不可直接覆蓋，避免另一台裝置的資料夾遺失），完成後 toast；本機資料不刪。之後在雲端模式新增/刪除資料夾也先讀最新雲端值再合併寫入。登出切回本機。說明文字依狀態切換（「存在你的 Google 帳號」/「只存在這個瀏覽器」）。
- 樣式放 `css/share.css`；新按鈕在 `@media (pointer:coarse)` 下也要 ≥ 44×44 px（006 會再整體目視檢查一次）。每檔 ≤ 400 行，必要時拆 `sharearea-render.js`。
- **深色模式**（AC-9，plan-critique-1 §1.1）：`css/share.css` 只用 `base.css` 既有的 CSS 變數（`--bg`、`--ink` 等，不寫死顏色）；若一定要新顏色，同時在 `base.css` 的深色區塊定義。登入列、共享卡片、作者標籤、空狀態、登入提示與發布確認 modal 在系統深色模式下文字都要可讀。
- 驗證：用 Firebase emulator（`npx firebase emulators:start --only auth,firestore`，在 `firebase-config.js` 以 `?emulator=1` 或 localhost 時連 emulator）跑完整流程：兩個瀏覽器設定檔分別作者/訪客/管理員；斷網（DevTools offline）檢查 AC-27；未登入從畫布「發布目前教案」走完 popup 與 redirect 兩種路徑（AC-20）；兩個瀏覽器設定檔各建不同資料夾後登入同帳號，確認資料夾合併（AC-28）；淺色/深色各截一組。截圖存 `.bridge/evidence/008/`。

## 交接筆記

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->
