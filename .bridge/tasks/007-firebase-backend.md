---
id: 007
title: Firebase 後端：規則與規則測試、雲端存取層、共享純邏輯
owner: claude
status: done
depends_on: [002]
reviewer: claude
attempts: 0
---

## 目標

建立登入與線上共享區的後端部分：Firestore 安全規則（含自動化規則測試）、延遲載入的 Firebase 包裝、雲端存取層，以及可在 Node 測試的共享區純邏輯。不做 UI（UI 在 008）。

## 涵蓋的驗收條件

- AC-22（發布紀錄含作者名稱與發布時間；寫入後重新讀取即可見）
- AC-23（作者可改/刪自己的；非作者非管理員改/刪被規則拒絕）
- AC-24（管理員可刪任何共享範本；前端判斷是否顯示「下架」）
- AC-25（未登入寫入任何資料被拒）
- AC-27（Firebase 載入或連線失敗時回報離線，不拋出未處理錯誤）
- AC-28（首次登入上傳本機範本的計畫邏輯）
- AC-29（加分：依場地篩選、分頁）

## 實作提示

資料模型（見 DECISIONS）：
- `shared/{id}`：`name`(≤40)、`court`、`grade`、`steps`(int)、`docJson`(string, ≤ 300 KB)、`authorUid`、`authorName`、`createdAt`、`updatedAt`（serverTimestamp）
- `users/{uid}`：`folders: string[]`；`users/{uid}/templates/{tplId}`：與本機範本相同欄位（`name, court, grade, steps, folder, updatedAt, docJson`）

檔案：
- `firestore.rules`：`shared` 公開讀；create 需登入、`authorUid == request.auth.uid`、欄位白名單與型別/長度檢查；update 需作者本人且不可改 `authorUid`/`createdAt`；delete 為作者或 `isAdmin()`；`users/{uid}/**` 只限本人。其他路徑全拒。`isAdmin()`：`request.auth.token.email in adminEmails() && request.auth.token.email_verified == true`。名單先放佔位 email，009 由使用者提供。
  - **名單固定格式**（plan-critique-1 §2.2）：名單只寫在一個函式裡、一行一個 email，前後有標記註解：
    ```
    // ADMIN_EMAILS:BEGIN
    function adminEmails() { return [
      'admin@example.com',
    ]; }
    // ADMIN_EMAILS:END
    ```
    一致性測試只取兩個標記之間、用 `/'([^']+@[^']+)'/g` 抓出 email 陣列，排序後與 `ADMIN_EMAILS` 比對；找不到標記時以清楚訊息失敗。009／010 填名單時照這個格式。
- `firestore.indexes.json`（plan-critique-1 §5.1）：`shared` 集合複合索引 `court ASC + createdAt DESC`（`listShared` 依場地篩選＋依時間排序需要）。不篩選場地時只用 `orderBy('createdAt','desc')`，單欄位索引自動存在。注意 emulator 不檢查索引，所以本機測試過不代表正式環境可用；010 部署後要實際打一次「依場地篩選」。
- `firebase.json`：firestore `rules`、`indexes` 路徑與 emulator 設定。
- `js/config/firebase-config.js`：`FIREBASE_CONFIG`（佔位值）、`ADMIN_EMAILS`。佔位時 `isConfigured()` 回 false。
- `js/store/firebase.js`：以 `import()` 從 `https://www.gstatic.com/firebasejs/12.19.0/firebase-{app,auth,firestore}.js` 載入（plan-critique-1 §5.3：鎖定 12.x 最新穩定版 12.19.0；13.0.0 於 2026-10-07 才發布的大版本，先不採用）。版本號只定義在這個檔案的一個常數。`getFirebase()` 回 `{auth, db}` 或 `null`（未設定/載入失敗/逾時，例如 8 秒），絕不讓錯誤冒到開機流程。提供 `signIn()`（popup，被擋時 redirect）、`signOut()`、`onUser(cb)`（回 `{uid, name, email, isAdmin}`）。
  - **背景初始化與轉址登入復原**（plan-critique-1 §5.2）：提供 `initFirebase()`，由 `main.js` 在畫布第一次渲染**之後**以不阻塞的方式呼叫（`setTimeout(…, 0)` 或 `requestIdleCallback`，不 `await`）。`initFirebase()` 載入 SDK 後**一律**呼叫 `getRedirectResult(auth)` 並註冊 `onAuthStateChanged`，讓 iPadOS Safari 走 `signInWithRedirect` 回來時自動恢復登入狀態。未設定（`isConfigured()` 為 false）時不載入 SDK。任何失敗只把狀態設成離線（AC-27），不影響畫圖。
  - `signIn()` 改走 redirect 前，呼叫端可傳入 `resumeIntent`（例如 `{action:'publish', tplId}`），寫入 `sessionStorage`（key `pe-board-resume`）；`initFirebase()` 在 `getRedirectResult` 成功後讀出並清除，透過 `onResume(cb)` 交給 UI（008 用來在回來後自動開啟發布對話框）。
- `js/store/cloud.js`：`listShared({court, after, limit:50})`、`publish(tpl, user)`、`updateShared(id, tpl)`、`deleteShared(id)`、`listMine(uid)`、`saveMine(uid, tpl)`、`deleteMine(uid, id)`、`saveFolders(uid, folders)`；所有錯誤轉成 `{offline:true}` 或帶 code 的錯誤。
- `js/core/share.js`（純）：`toSharedRecord(tpl, user)`、`fromSharedRecord(rec)`（`docJson`→`normalizeDoc`，壞資料丟掉）、`filterShared(list, {q, court})`（名稱搜尋，比對時兩邊都 `.toLowerCase()`，不存 `nameLower` 欄位）、`planFirstUpload(localMine, cloudMine)`（回傳要上傳的範本，以 id 去重）、`planFolderMerge(localFolders, cloudFolders)`（plan-critique-1 §1.3：聯集去重，保留雲端原順序、本機新增的接在後面；回傳 `{merged, changed}`，`changed` 為 false 時不必寫入）、`isAdmin(email, ADMIN_EMAILS)`。
  - `saveFolders(uid, folders)` 只寫 `planFolderMerge` 的結果，**不可直接用本機陣列覆蓋** `users/{uid}.folders`。
- 測試：
  - `tests/unit/share.test.js`：上述純函式（含 `planFolderMerge`：兩台裝置資料夾不同時合併後兩邊都在、重複不重複、雲端為空、本機為空）；`tests/unit/config.test.js`：`ADMIN_EMAILS` 與 `firestore.rules` 中名單一致（依上面的固定格式解析）；`firestore.indexes.json` 含 `shared` 的 `court`+`createdAt` 索引。
  - `tests/rules/firestore.rules.test.js` 使用 `@firebase/rules-unit-testing`（devDependency）＋ emulator：未登入對每個集合寫入被拒（AC-25）、他人改/刪被拒（AC-23）、作者可改刪、管理員可刪（AC-24）、`authorUid` 偽造被拒、過大 `docJson` 被拒、`users/{uid}` 他人讀寫被拒。
  - `package.json` 加 `"test:rules": "firebase emulators:exec --only firestore \"node --test tests/rules/\""`（firebase-tools 為 devDependency，`npm run` 會把 `node_modules/.bin` 放進 PATH，不需全域安裝；見 DECISIONS）。`npm test` 仍須零依賴可跑。在 npm script **以外**的地方（README、008 的手動驗證、009/010 的部署指令）一律加 `npx`（已 `npm install` 時用 `npx firebase …`，否則 `npx firebase-tools …`）。
- README 補「規則測試」段落（需 Java、`npm install`）。

## 交接筆記

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->

### 做了什麼
- `firestore.rules`：`shared` 公開讀；create 需登入＋`authorUid == auth.uid`＋欄位白名單（hasOnly/hasAll）＋型別/長度（name 1–40、docJson ≤ 300000 字元、steps 為 int）＋`createdAt/updatedAt == request.time`；update 限作者且不可改 `authorUid/createdAt`；delete 為作者或 `isAdmin()`（email 在名單且 `email_verified`）。`users/{uid}` 與 `templates/{id}` 只限本人並檢查欄位。其他路徑無規則＝全拒。名單依固定格式放在 `ADMIN_EMAILS:BEGIN/END` 之間（佔位 `admin@example.com`）。
- `firestore.indexes.json`（`shared`：court ASC + createdAt DESC）、`firebase.json`（rules/indexes、emulator：firestore 8080、auth 9099）。
- `js/config/firebase-config.js`：`FIREBASE_CONFIG`（佔位）、`ADMIN_EMAILS`、`isConfigured()`、`EMULATOR_CONFIG`。
- `js/store/firebase.js`：`SDK_VERSION = '12.19.0'`（唯一出現處）、`initFirebase()`（冪等、永不 reject；未設定不載入；8 秒逾時；一律 `getRedirectResult` → `onAuthStateChanged`）、`getFirebase()`（`{app, auth, db, au, fs}` 或 null；失敗後下次重試）、`getStatus()/onStatus()`（idle/loading/ready/offline/unconfigured）、`onUser()`（`{uid,name,email,isAdmin}`，isAdmin 需 emailVerified）、`currentUser()`、`onResume()`（晚註冊也拿得到、只交一次）、`signIn(resumeIntent)`（SDK 已載入時同步開 popup；`popup-blocked`/`operation-not-supported…` 時寫 `sessionStorage['pe-board-resume']` 再 redirect；回 `{ok,user}|{cancelled}|{redirect}|{offline}|{error}`）、`signOut()`；localhost 加 `?emulator` 改連 emulator。
- `js/store/cloud.js`：`createCloud(getFb)` 工廠＋預設匯出 `listShared/publish/updateShared/deleteShared/listMine/saveMine/deleteMine/saveFolders`。全部不拋錯，回 `{ok:true,…}`／`{offline:true}`／`{error:code}`（例如 `permission-denied`、`too-large`）；每次操作 15 秒逾時→offline。`listShared({court, after, limit=50})` 回 `{items, cursor, more}`。`saveFolders` 在 transaction 內 `planFolderMerge` 後才寫。
- `js/core/share.js`（純）：`toSharedRecord`、`sharedContent`、`fromSharedRecord`（壞 docJson→null，經 normalizeDoc；場地/年段/步數以 docJson 為準）、`toMineRecord/fromMineRecord`、`filterShared`、`planFirstUpload`（以 id 去重；不合法 id 給新 id）、`planFolderMerge(local, cloud, removed=[])`、`isAdmin`、`toCloudFailure`、常數 `DOC_JSON_MAX/PAGE_SIZE`。
- `package.json`：devDependencies 固定版本、`test:rules`；`.gitignore` 加 `*-debug.log`（emulator 產生的 log）；README「規則測試」段落；DECISIONS 追加 5 條。

### 怎麼驗證
- `npm test`：119 pass / 0 fail（新增 `share.test.js`、`config.test.js`、`firebase.test.js`；結構測試確認新檔 ≤ 400 行、core 無瀏覽器全域）。
  - `config.test.js`：rules 名單與 `ADMIN_EMAILS` 一致（找不到標記時清楚失敗）、rules 的 docJson 上限與 `DOC_JSON_MAX` 一致、索引檔、`firebase.json`、`isConfigured`、SDK 版本只有一個常數。
  - `firebase.test.js`（AC-27）：未設定→不載入、存取層與 signIn 回 `{offline:true}`；CDN 失敗、逾時→status offline 不拋錯且會重試；Firestore 操作逾時/拋錯轉結果物件；假 SDK 驗證 redirect 復原（resumeIntent 存取、只交一次、無轉址結果時清除）、管理員需 email_verified。
- `npm run test:rules`（Java 21、`npm install` 後）：9 pass / 0 fail。規則：AC-25 未登入對 shared/users/templates/其他路徑寫入全拒、可讀 shared；偽造 authorUid、docJson 300001 字元（300000 可過）、多餘欄位、自訂 createdAt、name 41 字、steps 非整數被拒；AC-23 他人改刪被拒、作者改 authorUid/createdAt 被拒、作者可改刪；AC-24 管理員可刪不可改、email 未驗證不算；users 只限本人。另以真正的 `cloud.js` 對 emulator：AC-22 發布後未登入讀回含作者名稱與伺服器時間、AC-23/24/25 存取層回 `permission-denied`、AC-29 依場地篩選＋cursor 分頁新到舊不重複、AC-28 首次上傳計畫＋saveMine/listMine/deleteMine＋資料夾合併不覆蓋與改名。

### 已知限制／給 008、009、010
- 與任務提示的差異：`test:rules` 多了 `--project demo-pe-board`（沒有 `.firebaserc` 時必要），路徑用 `tests/rules/*.test.js`（`node --test` 不吃目錄）；rules-unit-testing 用 5.0.2（6.x 需要 firebase 13）。
- `planFolderMerge`/`saveFolders` 多了 `removed` 參數：008 刪除資料夾傳 `[name]`、改名傳 `[from]`，否則聯集會把舊名補回來。
- `signIn` 要在 click handler 中呼叫且 SDK 已載入（`getStatus()==='ready'`）才會同步開 popup；SDK 未載入時會先 await 載入，Safari 可能擋 popup → 自動走 redirect。redirect 前 008 自己先 `save()` 教案。
- 離線時 Firestore 寫入可能已排入佇列，逾時回 `{offline:true}` 後仍可能稍後送出（publish 重試可能產生重複，UI 可提示使用者重新整理確認）。
- 前端 `isAdmin` 與規則一樣是大小寫敏感的完全比對，009 填名單時請用小寫 email。
- emulator 不檢查索引；010 部署後須在正式網址實測依場地篩選。`firebase-tools` 安裝時 `re2` 的 install script 被 npm allow-scripts 略過，不影響 emulator 執行。
