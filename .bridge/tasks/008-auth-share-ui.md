---
id: 008
title: 登入列與共享區 UI、我的範本雲端同步
owner: claude
status: done
depends_on: [004, 007]
reviewer: claude
attempts: 2
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

### 做了什麼

- `js/ui/auth.js`（新增）：頂端 `#authArea` 登入列。依 007 的 `onStatus`/`onUser` 顯示「登入中…」／「登入」（`unconfigured`／`offline` 時停用並帶 `title`）／已登入時顯示 `displayName`＋「登出」。`signIn()` 在 click handler 內同步呼叫（AC-21，popup 不被擋）。也實作「發布需要登入」提示 modal（`#loginPromptModal`），透過 `state.js` 的 `hooks.promptLogin(intent)` 讓 `sharearea.js` 呼叫；按登入前先 `save()` 再呼叫 `signIn(intent)`（AC-20，redirect 前教案已落地）。
- `js/ui/sharearea.js`（新增）：共享區分頁的搜尋（名稱，client 端）、場地篩選（server 端 `listShared({court})`，換場地即重新抓第一頁）、「載入更多」分頁（AC-29）、卡片顯示縮圖／作者／發布或更新時間（`YYYY/MM/DD HH:mm`）、「開啟」「存到我的範本」；作者本人多「更新為目前教案」「刪除」，`currentUser().isAdmin` 時多「下架」，都用既有 `armDanger` 二次確認。空狀態（AC-26）與離線/錯誤狀態（AC-27，含「重新整理」）。`startPublish(source)`（`{kind:'current'}` 或 `{kind:'mine',tplId}`）：未登入先 `hooks.promptLogin`，拿到使用者後開 `#publishModal` 讓使用者改名稱、確認「會公開給所有人」訊息後呼叫 007 的 `publish()`。`onResume` 收到轉址登入回來的待辦動作時自動呼叫 `openSharedTab()`＋`startPublish(intent)`（AC-20 redirect 路徑）。
- `js/ui/library.js`：加入 `shareHooks`（`renderNav/open/renderTools/renderGrid/act`，預設 no-op）給 `sharearea.js` 單向接上（UI 模組互不 import，`sharearea.js` 只 import `library.js` 的 `openSharedTab`/`shareHooks`，反向用 `state.js` 的 `hooks.startPublish`）；`renderLibTools/renderLibGrid` 在 `lib.view==='shared'` 時整段委派；「我的範本」卡片加「發布到共享區」按鈕（呼叫 `hooks.startPublish({kind:'mine',tplId})`）；`#libMsg` 依 `isCloud()` 顯示「存在 Google 帳號」或「只存在這個瀏覽器」（AC-28 說明文字）。
- `js/ui/library-store.js`：加入雲端模式。`onUser` 登入時呼叫 `migrateIfNeeded`：讀雲端 `listMine`，用 `planFirstUpload` 算出本機獨有的範本逐一 `saveMine` 上傳（本機 `pe-board-mytpl-v1` 不刪），用 `planFolderMerge` 合併資料夾後寫回；以 `localStorage['pe-board-migrated-{uid}']` 旗標避免重複上傳；完成後透過 `setToast()`（由 `library.js` 註冊）跳 toast。之後雲端模式下 `saveTpl/deleteTpl` 直接讀寫 `users/{uid}/templates/{id}`，`saveFolders` 一樣先算 `removed` 差集再呼叫 007 的 `saveFolders(uid, next, removed)`（內部用 transaction 合併，不覆蓋）。登出切回本機（`switchToLocal`）。雲端操作失敗（`offline`/其他 error code）會 throw 帶 `.code` 的 Error，沿用既有 `errText()`（已加 `offline` 文案）。
- `js/ui/savetpl.js`：存成範本 modal 加「也發布到共享區」checkbox，存檔成功後呼叫 `hooks.startPublish({kind:'mine',tplId})`；訊息文字依 `isCloud()` 切換。
- `js/main.js`：加入 `initAuth`、`initSharearea`；畫布第一次 `renderAll()` 之後才呼叫 007 的 `initFirebase()`（不阻塞開機，AC-27）。
- `index.html`：頂端加 `#authArea`；新增 `#loginPromptModal`、`#publishModal`；`saveModal` 加「也發布到共享區」checkbox；引入 `css/share.css`。
- `css/share.css`（新增）：登入列、checkbox、共享區空狀態與「載入更多」卡片樣式，只用 `base.css` 既有變數（`--muted` 等），深色模式沿用既有變數不需另外處理；`@media (pointer:coarse)` 下登入／modal 按鈕與 checkbox 放大到 ≥44px。

### 怎麼驗證

- `npm test`：127 筆全過（含既有 007 的 `share.test.js`、`structure.test.js` 的 400 行與 `js/core` 不碰 DOM 檢查，新檔案都在限制內：`sharearea.js` 183 行、`auth.js` 71 行、`library.js` 200 行）。
- `node --check` 全部新/改檔案語法通過；另外用 Node 搭配最小 `document`/`localStorage`/`sessionStorage` stub 分別 `import()` `auth.js`、`sharearea.js`、`savetpl.js`、`library.js`，確認模組圖可以解析、沒有匯入/匯出名稱打錯（互相 import 的方向：`sharearea.js → library.js`、`sharearea.js/library.js/savetpl.js → state.js`，符合「UI 模組互不 import、用 hooks 接」的既有慣例，無循環 import）。
- 用 `python3 -m http.server` 啟動後以 HTTP 確認 `index.html`、`js/main.js`、新增的 `js/ui/auth.js`、`js/ui/sharearea.js`、`css/share.css` 都能正常取得（200）。

### 第二輪修正（回應 `.bridge/reviews/008-r1.md` 的 FAIL）

- 問題：redirect 登入回來時，`js/store/firebase.js` 的 `load()` 在拿到 `getRedirectResult` 後立刻 `emit(resumeCbs, intent)`，但設定 `user`／`userKnown` 的 `onAuthStateChanged` 回呼是非同步觸發，順序顛倒，導致 `sharearea.js` 的 `onResume` 回呼觸發時 `currentUser()` 還是 `null`，`startPublish` 誤判「未登入」又跳出一次登入提示（AC-20、AC-21 違反）。
- 修法：採 review 建議的做法 1。`js/store/firebase.js`：把轉址結果先存到區域變數 `resumeIntent`，移到 `onAuthStateChanged` 的**初次**回呼內（`user`／`userKnown` 設好之後）才 `pendingResume = resumeIntent; emit(resumeCbs, resumeIntent)`；多加一行：emit 時若 `resumeCbs.size` 非 0（表示已經有訂閱者即時收到），就把 `pendingResume` 清空，避免之後晚註冊的訂閱者又收到一次重複的待辦（原設計「只交出一次」的語意在新時序下需要這一行才成立）。`sharearea.js`／`library.js` 等 008 自己的檔案不用改，問題根因在 007 交付的 `firebase.js`（008 依賴 007；owner 同為 claude，不是跨 agent 任務，改動範圍限定在這一段時序 bug，未動 007 的其他邏輯／Firestore 規則／存取層）。
- 驗證：`tests/unit/firebase.test.js` 新增一筆測試直接重現 review 給的場景（`onResume` 觸發時檢查 `currentUser()` 是否已經是轉址登入回來的使用者），修法前會失敗、修法後通過；另外兩筆既有的 `onResume` 測試因為事件改成非同步交付，補上 `await new Promise(r => setTimeout(r, 5))` 等到 `onAuthStateChanged` 的初次回呼跑完才斷言（並把「晚註冊」那筆測試的第二個訂閱者改成在等待之後才訂閱，才能驗證「只交出一次」仍成立）。`npm test`：128 筆全過。`node --check js/store/firebase.js` 語法通過；`js/store/firebase.js` 140 行、`tests/unit/firebase.test.js` 164 行，都在 400 行限制內。

### 已知限制

- **沒有實機／瀏覽器驗證**：這個環境沒有瀏覽器自動化工具，所以 Firebase emulator 的完整互動流程（AC-19～29：popup／redirect 兩種登入路徑、兩個瀏覽器設定檔的作者/訪客/管理員情境、斷網情境、資料夾合併、淺色/深色截圖）**尚未實際跑過**，只做了上面列的靜態檢查。PLAN.md 把瀏覽器 E2E 驗收明確排給 006/010（`antigravity_ide`），建議接著跑那一輪驗收，並把 `.bridge/evidence/008/` 的截圖補上。
- 共享區「依名稱搜尋」只在目前已抓到的分頁（`listShared` 的這一頁，最多到使用者按「載入更多」為止）中做 client 端過濾，不會額外發後端查詢去搜尋尚未載入的更舊範本；場地篩選才是真的重新查詢。對 AC-29（加分項）已足夠，但使用者搜尋罕見名稱、又還沒按「載入更多」時可能顯示「沒有符合條件」。
- `firebase-config.js` 的 `FIREBASE_CONFIG`／`ADMIN_EMAILS` 仍是 009 的 `REPLACE_ME` 佔位值；在真正設定值進來前，`status` 會停在 `unconfigured`，登入列會停用、共享區會顯示離線提示（這是預期行為，AC-27）。
- `js/ui/sharearea.js` 的「存到我的範本」目前永遠存一份新 id（不嘗試比對是否已存過同一個共享範本），避免需要額外欄位追蹤來源；使用者若重複按會多出重複的本機範本，可自行刪除。
