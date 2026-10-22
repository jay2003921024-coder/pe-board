# 體育教案圖板

給體育老師畫教案戰術圖的網頁：14 種場地、學生／老師／器材／路線、多步驟教案與動畫、匯出 PNG、範本庫、Google 登入後可發布到線上共享區。
純靜態網站（原生 JavaScript ES modules，無建置步驟），部署在 GitHub Pages：<https://jay2003921024-coder.github.io/pe-board/>。

> 舊版單檔 `legacy/pe-board.html` 保留作為測試的參考答案，**凍結不再修改**。它會一起部署但不是入口頁，請不要分享這個檔案的連結。

## 本機執行

需要 http(s) 網址（ES modules 與 Google 登入不支援 `file://` 直接雙擊開啟）。在專案根目錄執行：

```sh
python3 -m http.server 8000
```

然後用瀏覽器開啟 <http://localhost:8000/>。

## 測試

需要 Node.js 22 以上，不需要 `npm install`：

```sh
npm test
```

- `tests/unit/render.golden.test.js`、`export.golden.test.js`、`templates.golden.test.js`、`anim.golden.test.js`：場地、物件、線條、工具圖示、匯出 SVG、內建範本、動畫配對必須與舊版逐字相同
- `tests/unit/doc.test.js`、`tplfile.test.js`、`history.test.js`、`viewport.test.js`、`share.test.js`、`firebase.test.js`：教案資料正規化（含舊版資料）、範本檔匯入匯出、復原重做、縮放平移、共享區純邏輯
- `tests/unit/config.test.js`：`ADMIN_EMAILS`（`js/config/firebase-config.js`）與 `firestore.rules` 的管理員名單必須一致，索引檔與 `firebase.json` 設定正確
- `tests/unit/structure.test.js`：`js/`、`css/` 每檔不超過 400 行；`js/core/` 不得使用 `document`、`window`、`localStorage`、`navigator`
- `tests/helpers/legacy.js`：從 `legacy/pe-board.html` 依註解標記切出舊版程式碼，在 `node:vm` 中執行，當參考答案

## 規則測試（Firestore 安全規則）

需要 Java 11 以上與 `npm install`（安裝 devDependencies：`firebase-tools`、`@firebase/rules-unit-testing`、`firebase`）：

```sh
npm install
npm run test:rules
```

會啟動本機 Firestore emulator（專案 `demo-pe-board`，不連線到正式環境），執行 `tests/rules/`：
未登入寫入被拒、非作者改刪被拒、作者可改刪、管理員可刪、`users/{uid}` 只限本人，並以 `js/store/cloud.js` 實際讀寫 emulator。

在 npm script 以外手動使用 Firebase CLI 時一律加 `npx`（例如 `npx firebase emulators:start`）。
本機開發登入與共享區：`npx firebase emulators:start --project demo-pe-board` 後，開啟 <http://localhost:8000/?emulator>。

注意：emulator 不檢查複合索引（`firestore.indexes.json`），部署後要在正式網址實際測一次「依場地篩選」。

## 部署（GitHub Pages ＋ Firebase）

1. **GitHub Pages**：repo 推到 GitHub 後，到「Settings → Pages」選 `main` 分支、根目錄。根目錄已有 `.nojekyll`（讓以 `_` 開頭的資源與 `js/`、`css/` 都能被服務）。網址會是 `https://<帳號>.github.io/<repo>/`，所有資源路徑都是相對路徑，可直接在專案網址（有 `/<repo>/` 前綴）下運作。
2. **Firebase 授權網域**：Firebase 主控台「Authentication → 設定 → 授權網域」加入 Pages 的網域（例如 `<帳號>.github.io`），否則 Google 登入會被擋。
3. **部署 Firestore 規則與索引**（agent 不持有使用者的 Firebase 登入，須由使用者本人執行）：

   ```sh
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <firebase 專案 id>
   ```

   索引建立需要幾分鐘，Firebase 主控台「Firestore → 索引」顯示「已啟用」才算完成；索引生效前「依場地篩選」共享區會在正式環境失敗（`FAILED_PRECONDITION`）。
4. **設定值**：`js/config/firebase-config.js` 的 `FIREBASE_CONFIG`（公開設定值，不是密碼）與 `ADMIN_EMAILS`，以及 `firestore.rules` 的 `ADMIN_EMAILS:BEGIN`／`END` 名單要同步修改（`npm test` 的 `config.test.js` 會檢查兩份名單一致）。

## 從舊版搬資料

- **同一個網域**（例如舊版也放在同一個 GitHub Pages 網址）：新版第一次開啟會自動讀到舊版 localStorage 的教案與「我的範本」，不需任何操作。
- **不同網址**（例如舊版是在 Claude Artifact 環境使用）：localStorage 無法跨網域共用，請在舊版按「匯出範本檔」存成 JSON，再到新版「範本庫 → 我的範本 → 匯入範本檔」匯入；新版匯出的檔案也能被新版再匯入。
- 舊版的「學校共用」（`window.claude` Artifact 存取）已移除，改用本版的線上共享區；舊版共享的範本不會自動搬過來，需要的人請用上面的匯出／匯入方式搬。

## 管理員名單怎麼改

管理員可以在共享區對任何範本按「下架」。要新增或移除管理員：

1. 修改 `js/config/firebase-config.js` 的 `ADMIN_EMAILS` 陣列（決定前端是否顯示「下架」按鈕）。
2. 同步修改 `firestore.rules` 中 `// ADMIN_EMAILS:BEGIN` ～ `// ADMIN_EMAILS:END` 之間的 `adminEmails()` 名單（決定後端是否真的允許刪除），格式為一行一個單引號 email。
3. 執行 `npm test` 確認兩份名單一致，再部署規則：`npx firebase-tools deploy --only firestore:rules --project <firebase 專案 id>`。

管理員身分需要 Google 帳號 email 已驗證（`email_verified`）。

## 回歸驗收清單

`docs/REGRESSION.md` 列出 AC-1～AC-29 每一條的「前置狀態 → 操作步驟 → 預期結果」，並標明由誰驗證（`npm test` 自動／瀏覽器 e2e／真機人工）。

## 目錄結構

```
index.html             外殼：版面骨架、各個 modal
pe-board.html          舊書籤轉址頁（跳轉到 ./）
.nojekyll               GitHub Pages：不要用 Jekyll 處理
legacy/pe-board.html   舊版原檔（凍結，只當測試參考答案，部署時一起上線但不是入口）
css/                   base／layout／modals／touch／share 樣式
js/
  main.js              開機，依序初始化各 UI 模組
  core/                純邏輯：不碰 DOM、storage、Firebase，可直接用 Node 測
    util.js            W、FONT、uid、f、esc
    courts.js          14 種場地定義、scaleOf、courtH、courtSVG
    items.js           隊伍、顏色、物件與線條定義
    render.js           itemSVG、lineSVG、boardContent、iconSVG
    doc.js             教案資料正規化、讀舊版 pe-board-v1
    templates.js       內建範本
    history.js         復原／重做
    anim.js            動畫步驟配對、播放
    exportsvg.js       匯出 SVG
    tplfile.js         範本檔序列化／解析
    viewport.js        畫布縮放平移計算
    share.js           共享區純邏輯（篩選、分頁、首次登入上傳計畫、管理員判斷）
  ui/                  碰 DOM 的互動
    state.js           唯一的可變狀態
    board.js／editor.js／toolbar.js／props.js／steps.js／keyboard.js／player.js
    exporter.js／library.js／library-store.js／library-actions.js／savetpl.js
    touch.js           平板操作列、雙指縮放、螢幕鍵盤遮擋處理
    auth.js／sharearea.js  登入列、共享區
  store/
    local.js           localStorage（pe-board-v1、pe-board-mytpl-v1）
    firebase.js        以 CDN 動態載入 Firebase，離線時回報
    cloud.js           Firestore 存取層：我的範本、共享區
  config/firebase-config.js  公開設定值、ADMIN_EMAILS
firestore.rules、firestore.indexes.json、firebase.json  Firestore 規則與索引
tests/unit/            node:test 單元測試
tests/rules/           Firestore 規則測試（需 emulator）
tests/helpers/         測試輔助（舊版程式碼載入、原始碼去註解字串）
docs/REGRESSION.md     AC 逐條回歸驗收清單
```
