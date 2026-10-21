# 實作計畫

> 由 planner agent 依 SPEC 產生，critic agent 挑戰後修訂。

## 架構概述

把 `pe-board.html`（1600 行，單一 IIFE）拆成**多檔原生 ES modules 的靜態網站**，分三層：

```
index.html                 # 外殼：版面骨架、modal、<script type="module" src="js/main.js">
pe-board.html              # （010）轉址到 index.html，保留舊書籤
css/                       # base.css（變數/深色）、layout.css、modals.css、touch.css、share.css
js/
  main.js                  # 開機：載入狀態、綁定各 UI 模組
  core/                    # 純邏輯：不碰 DOM、不碰 localStorage、不碰 Firebase → 可直接用 Node 測
    util.js                #   W、FONT、uid、f、esc
    courts.js              #   14 種場地定義、scaleOf、courtH、courtSVG
    items.js               #   TEAMS、INKS、ITEMS、LINES、shape、selR、textHalfW、iconSVG
    render.js              #   qpt/qder、lineSVG、itemSVG、boardContent
    templates.js           #   tplBuilder、8 個內建範本、docFromTemplate
    doc.js                 #   normalizeDoc、loadSavedDoc（讀舊版 pe-board-v1）、tplFromDoc、shiftObj、nextLabel
    history.js             #   復原/重做堆疊（上限 80，JSON 快照）
    anim.js                #   ease、matchItems、findPath、planTransition、posAt
    exportsvg.js           #   wrapText、exportSVG(doc, indices, withNotes)
    tplfile.js             #   範本檔序列化/解析（{app:'pe-board',version:1,templates}）、本機範本庫解析
    viewport.js            #   （005）縮放/平移的 viewBox 計算
    share.js               #   （007）共享區紀錄建立/驗證、搜尋/篩選/分頁、首次登入上傳計畫、管理員判斷
  ui/                      # 碰 DOM 的部分
    state.js               #   唯一的可變狀態（doc、ui、history）＋ mutate/save/渲染掛勾
    board.js               #   renderBoard、overlay、選取框
    editor.js              #   畫布 pointer 互動（放置、拖曳、框選、控制點）
    toolbar.js / props.js / steps.js / keyboard.js / player.js（動畫播放）
    exporter.js            #   匯出 modal、SVG→PNG、複製圖片
    library.js / savetpl.js#   範本庫 modal、存成範本
    touch.js               #   （005）平板操作列、雙指縮放、螢幕鍵盤
    auth.js / sharearea.js #   （008）登入列、共享區
  store/
    local.js               #   localStorage（pe-board-v1、pe-board-mytpl-v1）
    firebase.js            #   （007）以 CDN 動態 import Firebase，失敗時回報離線
    cloud.js               #   （007）Firestore 存取層：我的範本、共享區
  config/firebase-config.js#   公開設定值＋ADMIN_EMAILS（009 由使用者填）
firestore.rules, firestore.indexes.json, firebase.json
legacy/pe-board.html       # 舊版原檔，**只當測試的參考答案**，不再修改
tests/unit/*.test.js       # node:test，零依賴
tests/rules/*.test.js      # Firestore 規則測試（需 emulator，另一個指令）
tests/helpers/legacy.js    # 在 node:vm 中執行舊版的純繪圖/資料程式碼（固定先跑前導段 W/FONT/uid/f/esc），取得參考輸出
docs/REGRESSION.md         # （010）人工回歸清單：AC 逐條的操作步驟
```

**關鍵設計**

1. **舊版當參考答案（golden test）**：舊版 `<script>` 裡「Courts → Templates」與 `wrapText/exportSVG`、`matchItems/planTransition` 都是純函式。`tests/helpers/legacy.js` 從 `legacy/pe-board.html` 切出這些程式碼段落，在 `node:vm` 中執行（固定 `Math.random` 讓 uid 可重現），新模組的輸出必須**逐字相同**。這讓 AC-1、2、5、8 的「與舊版相同」可自動驗證，不靠目測。第一個標記之前的前導段（`W`、`FONT`、`uid`、`f`、`esc`）由 helper 一律先執行；`iconSVG`／`exportSVG` 讀的閉包變數只注入最小欄位，若某段假環境過於複雜，該函式改用一次性產生的靜態 fixture（見 001）。
2. **core 不碰外界**：所有可測邏輯放 `js/core/`，靠參數傳入 doc，不讀全域。UI 層只做 DOM 與事件。
3. **單一狀態模組**：`ui/state.js` 持有 `doc`、`ui`、history，提供 `mutate(fn)`、`save()`、`onRender(fn)` 註冊；其他 UI 模組只 import state，不互相 import，避免循環依賴。
4. **Firebase 背景載入**：`main.js` 不靜態 import Firebase；畫圖功能先開機、畫布第一次渲染後，以不阻塞方式呼叫 `initFirebase()`，由 `store/firebase.js` 以 `import()` 從 gstatic CDN（鎖定 12.19.0）載入，並**每次開機都呼叫 `getRedirectResult`**，讓 iPadOS Safari 轉址登入回來時自動恢復登入與待辦的發布動作。CDN 或網路失敗只影響登入與共享區（AC-27）。
5. **資料相容**：localStorage key、doc 結構（steps/items/court…）、範本檔格式一律不改名，只能新增欄位（A9）。

## 技術選擇與理由

| 項目 | 選擇 | 理由 |
|---|---|---|
| 前端 | 原生 ES modules，無建置 | SPEC 限制；GitHub Pages 直接服務 |
| 單元測試 | Node 內建 `node:test` + `node:assert`（Node ≥ 22） | AC-13 要求零建置；`npm test` 不需 `npm install` |
| 舊版回歸 | 從 `legacy/pe-board.html` 切程式碼在 `node:vm` 執行，比對 SVG 字串 | 「與舊版相同」可機器驗證；不需瀏覽器 |
| 登入/雲端 | Firebase Auth（Google，`signInWithPopup`，被擋退回 `signInWithRedirect`）＋ Firestore，CDN 模組化 SDK **12.19.0** | SPEC 限制；popup 不離開頁面，教案不遺失（AC-20），2 次點擊（AC-21）；redirect 回來由開機時的 `getRedirectResult` 復原 |
| 共享區索引 | `firestore.indexes.json`：`shared` 的 `court ASC + createdAt DESC` | 依場地篩選＋依時間排序需要複合索引，否則正式環境 `FAILED_PRECONDITION`（emulator 不檢查） |
| 共享區文件 | `shared/{id}`，教案內容存成 JSON 字串 `docJson` | 規則容易限制大小與型別；讀回時與「匯入範本檔」走同一條 `normalizeDoc` 路徑 |
| 我的範本（登入後） | `users/{uid}/templates/{tplId}`、`users/{uid}` 存資料夾 | 只限本人讀寫；用本機範本 id 當 doc id，首次登入上傳可重複執行不重複 |
| 管理員 | 規則中 `request.auth.token.email in [...] && email_verified` | A4；前端同一份名單只用來決定是否顯示「下架」 |
| 下架 | 直接刪除 `shared/{id}` | AC-24 只要求消失；非目標不含審核流程 |
| 規則測試 | `@firebase/rules-unit-testing` + Firestore emulator，`npm run test:rules` | AC-23、25 需要「直接呼叫後端被拒」的證據；需 Java，故與 `npm test` 分開 |
| 縮放平移 | 改 `<svg>` 的 viewBox，不用 CSS transform | `pt()` 用 `getScreenCTM()` 仍正確；匯出走 `exportSVG` 與畫面無關（AC-18） |
| 移除 | 舊版 `window.claude` Artifact 存取路徑 | GitHub Pages 沒有此環境；非目標明定不搬移 Artifact 資料 |

## 任務拆解

| id | 標題 | owner | 依賴 | 涵蓋 AC |
|---|---|---|---|---|
| 001 | 專案骨架、測試環境、場地與物件繪圖核心 | claude | — | AC-1、AC-2（繪圖）、AC-11、AC-12（檢查機制）、AC-13（環境） |
| 002 | 教案資料、範本、復原重做、動畫配對、匯出 SVG、範本檔核心 | claude | 001 | AC-4（邏輯）、AC-5（SVG）、AC-6（正規化）、AC-7、AC-8、AC-13 |
| 003 | UI 拆分（一）：外殼、CSS、狀態中心、畫布渲染、工具列、步驟、本機儲存 | claude | 002 | AC-1、AC-4（步驟）、AC-6（教案）、AC-9、AC-12 |
| 011 | UI 拆分（一之二）：畫布互動、屬性面板、快捷鍵、動畫播放 | claude | 003 | AC-2、AC-3、AC-4（動畫）、AC-12 |
| 004 | UI 拆分（二）：匯出 PNG、範本庫（內建／我的）、存成範本、檔案匯入匯出 | claude | 011 | AC-5、AC-6（我的範本）、AC-7、AC-8、AC-12 |
| 005 | 平板觸控邏輯：操作列、多選、觸控命中、雙指縮放、螢幕鍵盤 | claude | 004 | AC-15、AC-16、AC-17（程式碼層級）、AC-18 |
| 006 | 平板版面目視調整：iPad 橫/直、44px 觸控區（含共享區 UI） | antigravity_ide | 005、008 | AC-14、AC-15、AC-17（程式碼層級） |
| 007 | Firebase 後端：規則與規則測試、索引、雲端存取層、共享純邏輯 | claude | 002 | AC-22、AC-23、AC-24、AC-25、AC-27、AC-28、AC-29（邏輯） |
| 008 | 登入列與共享區 UI、發布入口、我的範本雲端同步 | claude | 004、007 | AC-9（共享區 UI）、AC-19、AC-20、AC-21、AC-22、AC-23、AC-24、AC-26、AC-27、AC-28、AC-29 |
| 009 | 建立 Firebase 專案、提供設定、部署規則與索引、開 GitHub Pages | human | 007 | AC-10、AC-22（前置） |
| 010 | 部署整合、README 完稿、舊網址轉址、回歸清單與實機驗證 | claude | 006、008、009 | AC-10、AC-11、AC-12、AC-22 |

（011 由原 003 拆出，見 plan-critique-1 §3.1；用 011 而非重排編號，是為了不動其他任務的引用。）

依賴圖：`001 → 002 → 003 → 011 → 004 → 005 ─┐`，`002 → 007 → 008（也依賴 004）─┤ → 006 ─┐`，`007 → 009 ──────┤ → 010`（010 依賴 006、008、009）。
006 排在 008 之後，平板目視調整才能涵蓋登入列與共享區（plan-critique-1 §3.2）。007 可與 003～005 並行（只碰 `js/core/share.js`、`js/store/`、規則與索引檔）。

**檔案分工（避免互改）**：001 只建 core 繪圖與測試骨架；002 只加 core 其餘檔案；003 建 `index.html`、`css/{base,layout,modals}.css`、`js/main.js`、`js/ui/{state,board,toolbar,steps}.js`、`js/store/local.js`；011 新增 `js/ui/{editor,props,keyboard,player}.js`，對 003 的檔案只做新增；004 新增匯出與範本庫相關 `js/ui/` 檔並擴充 `store/local.js`；005 新增 `js/ui/touch.js`、`js/core/viewport.js`、`css/touch.css` 並小改 editor/board；006 只改 `css/`（含 `share.css`；必要時 `index.html` 的 class）；007 只碰 `firestore.rules`、`firestore.indexes.json`、`firebase.json`、`js/store/{firebase,cloud}.js`、`js/core/share.js`、`js/config/`、`tests/rules/`；008 新增 `js/ui/{auth,sharearea}.js`、`css/share.css` 並改 `library.js`、`savetpl.js`、`main.js`（掛 `initFirebase`）、`index.html` 頂端列。

## 測試策略

**建議的測試指令（`config.toml` 的 `[tests] command` 目前空白，001 完成後請設為）：`npm test`**
（`package.json`：`"test": "node --test \"tests/unit/**/*.test.js\""`，零依賴、不需 `npm install`；需 Node ≥ 22。）

| 層級 | 內容 | 指令 | 對應 AC |
|---|---|---|---|
| 單元（core） | 正規化（含舊版 `pe-board-v1`、壞資料）、範本檔匯入/匯出往返、復原/重做、動畫配對、共享紀錄驗證、搜尋分頁、首次登入上傳計畫 | `npm test` | AC-6、7、13、28、29 |
| 舊版 golden | 14 場地 `courtSVG`、每種物件/線條 `boardContent`、8 個內建範本、`exportSVG`（單步/全部＋說明）、`iconSVG` 與舊版逐字相同 | `npm test` | AC-1、2、5、8 |
| 結構 | `js/**`、`css/**` 每檔 ≤ 400 行；`js/core/**` 不得出現 `document`/`window`/`localStorage`（先去掉註解與字串再比對）；`ADMIN_EMAILS` 與 `firestore.rules` 中 `ADMIN_EMAILS:BEGIN/END` 標記間的名單一致；索引檔含 `shared` 複合索引 | `npm test` | AC-12、24、29 |
| 規則 | 未登入寫入被拒、非作者改/刪被拒、作者可改、管理員可刪、`users/{uid}` 只限本人 | `npm run test:rules`（需 Java＋`npm install`） | AC-23、24、25 |
| 瀏覽器 E2E | `docs/REGRESSION.md` 逐條操作；**antigravity_ide**（e2e 角色）以瀏覽器與 DevTools 裝置模擬 iPad 1024×768/768×1024，截圖/錄影存 `.bridge/evidence/e2e/` | 010 完成後由 e2e 執行 | AC-3、4、9、10、14～16、18～22、26、27 |
| 真機人工 | 實體 iPad：螢幕鍵盤不遮擋、iPadOS Safari 開啟與登入（含 redirect）；「複製圖片」貼進 Google 文件 | 使用者依 REGRESSION 標記「真機人工」的項目 | AC-5（貼上）、10（iPadOS）、17、21（iPad） |

DOM 相關程式不做自動化單元測試（不引入 jsdom/Playwright，避免依賴與建置），改由「把邏輯推到 core 並測 core」＋ REGRESSION 清單把關。

## 風險

| 風險 | 影響 | 對策 |
|---|---|---|
| 拆分時行為細節走樣（快捷鍵、typingUndo、拖曳中的 undo 時機） | 高（使用者最在意） | 003/011/004 盡量「搬移不改寫」；golden test；REGRESSION 清單逐條對照舊版 |
| 舊版程式碼段落切割（golden helper）因註解標記不穩、前導段遺漏或閉包依賴而失效 | 中 | 舊版放 `legacy/` 後凍結不改；helper 固定先跑前導段，以註解標記切段，找不到就以清楚訊息失敗並有 smoke test；假環境過於複雜的函式改用一次性靜態 fixture |
| 正式環境缺 Firestore 複合索引 | 高（共享區依場地篩選整頁失敗） | 007 建 `firestore.indexes.json`；009/010 以 `--only firestore:rules,firestore:indexes` 部署；010 在正式網址實測篩選 |
| AC-6 只在**同網域**成立（A1）：舊版若在 Claude Artifact 用，localStorage 讀不到 | 高 | README 與範本庫說明寫明「先在舊版匯出範本檔→新版匯入」；010 在根目錄保留 `pe-board.html` 轉址 |
| iPadOS Safari：`signInWithPopup` 被擋、第三方儲存分割、redirect 回來看似未登入 | 高 | 只在按鈕 click 中同步呼叫 popup；被擋時先 `save()` 再退回 `signInWithRedirect`，待辦動作存 `sessionStorage`；每次開機背景 `initFirebase()` 呼叫 `getRedirectResult` 復原登入與發布對話框；authDomain 用 `*.firebaseapp.com`，010 實機驗證 |
| 雲端資料夾被另一台裝置覆蓋 | 中 | `planFolderMerge` 聯集合併後才寫入 `users/{uid}.folders`，不直接覆蓋 |
| Firebase 設定值與管理員帳號要等使用者（009） | 中 | 007/008 先用 emulator 與假設定開發；`firebase-config.js` 缺值時共享區顯示「尚未設定」而不是錯誤 |
| 規則測試需要 Java、firebase-tools | 低 | 本機已有 OpenJDK 21；與 `npm test` 分開，CI 非必要 |
| 單檔 ≤ 400 行：`templates.js`、`library.js` 可能超過 | 中 | 預先拆檔（內建範本可分兩檔；library 拆 nav/grid/actions）；結構測試會擋 |
| Firestore 讀取額度（Spark 每日 5 萬次） | 低 | 共享區一次 `limit(50)` 分頁，不用 onSnapshot 監聽整個集合 |
| 螢幕鍵盤遮擋在不同瀏覽器行為不一 | 中 | 用 `visualViewport` resize 事件把焦點欄位捲入可見區；005/006 只能做程式碼層級檢查（DevTools 不會彈出螢幕鍵盤），AC-17 列為真機人工驗收項 |
