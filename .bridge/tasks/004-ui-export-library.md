---
id: 004
title: UI 拆分（二）：匯出 PNG、範本庫（內建／我的）、存成範本、檔案匯入匯出
owner: claude
status: done
depends_on: [011]
reviewer: claude
attempts: 1
---

## 目標

補上舊版剩下的 UI：匯出圖片 modal、範本庫（內建範本、我的範本＋資料夾、空白教案）、存成範本、匯入/匯出範本檔。完成後新版在離線、未登入狀態下與舊版功能完全對等（不含舊版 Artifact「學校共用」分頁，見 DECISIONS）。

## 涵蓋的驗收條件

- AC-5（匯出目前步驟／全部步驟＋說明；複製圖片）
- AC-6（開啟範本庫時讀到舊版 `pe-board-mytpl-v1` 的我的範本與資料夾）
- AC-7（匯入舊版範本檔；匯出後再匯入）
- AC-8（套用內建範本）
- AC-12（每檔 ≤ 400 行）

## 實作提示

- 依賴 011（畫布互動、屬性面板等已完成），本任務只新增檔案與在 `main.js` 掛載 init。

- `js/ui/exporter.js`：舊版 1221～1246 行，SVG 由 `core/exportsvg.js` 產生，canvas 2× 轉 PNG、`ClipboardItem` 複製、失敗訊息同舊版。
- `js/store/local.js` 擴充：`loadLib()`／`saveLib({mine, folders})`，key 固定 `pe-board-mytpl-v1`，解析用 `core/tplfile.parseLocalLib`。
- 範本庫設計成**來源可替換**：`js/ui/library-store.js` 提供 `mine/folders` 的讀寫介面（`saveTpl`、`deleteTpl`、`saveFolders`、`subscribe`），此任務只實作本機版本；008 會加入雲端版本並在登入時切換。
- `js/ui/library.js`（modal 開關、nav、tools、grid 渲染）必要時拆 `library-actions.js`；`js/ui/savetpl.js`（存成範本 modal，舊版 1558～1593）。舊版 `lib.db`／`window.claude`／`share`／`unshare`／學校共用分頁的程式**不要搬**，nav 先留一個「共享區」位置的註解或空容器給 008。
- 匯出範本檔：`core/tplfile.serializeTemplates`，用 `<a download>` 下載；匯入用 `parseTemplateFile`，名稱與資料夾規則同舊版。
- 文字說明：「我的範本目前只存在這個瀏覽器裡，建議定期匯出範本檔備份。」（舊版 Claude 帳號相關文案移除）。
- 驗證：在同一個 `localhost:8000` origin 先開 `legacy/pe-board.html` 存幾個範本與資料夾、畫一份教案 → 開 `index.html`，教案與範本、資料夾都在（AC-6 的同網域情境）；從舊版匯出範本檔 → 新版匯入；比對兩版匯出的 PNG。

## 交接筆記

**做了什麼**

- `js/ui/exporter.js`：匯出 modal（目前步驟／全部步驟＋說明切換、SVG→canvas 2× PNG、複製圖片、失敗文案），搬自舊版 1221～1246 行，呼叫 `core/exportsvg.exportSVG`。
- `js/store/local.js` 擴充 `loadLib()`／`saveLib({mine,folders})`，key 固定 `pe-board-mytpl-v1`，解析用既有的 `core/tplfile.parseLocalLib`（002 已完成）。
- `js/ui/library-store.js`（新檔）：範本庫「我的範本／資料夾」的來源可替換介面，本任務只接本機版本（`saveTpl`／`deleteTpl`／`saveFolders`／`getMine`／`getFolders`／`subscribe`）；008 之後會換成雲端版本但保留同一組函式名與 `subscribe` 通知機制。
- `js/ui/library-actions.js`（新檔，依任務提示拆出）：不碰 DOM 渲染的操作邏輯——`libList`／`findLibItem`／`openDoc`／`libAct`（open／rename／copy／del／newFolder／renameFolder／delFolder／import／exportFile）／`exportTemplates`／`armDanger`／`errText`。拿掉舊版 `window.claude`、`share`、`unshare`、學校共用分頁的程式，改用 `<a download>` 下載範本檔。
- `js/ui/library.js`（新檔）：範本庫 modal 的開關、nav（內建／我的範本＋資料夾，含新增/改名/刪除資料夾）、搜尋與場地/年段篩選工具列、網格渲染與事件綁定；nav 留了空容器 `#libNavShared` 給 008 接「共享區」。也在這裡統一處理三個 modal 的關閉（`data-close`、點背景）。
- `js/ui/savetpl.js`（新檔）：存成範本 modal（另存新範本／更新目前範本的切換、資料夾選單含「新資料夾」、送出後 `doc.srcTpl` 記住來源範本 id），搬自舊版 1558～1593 行，文案已移除舊版「存在你的 Claude 帳號」字樣，改成「這個瀏覽器裡」。
- `js/main.js`：掛上 `initExporter`／`initLibrary`／`initSaveTpl`。

**怎麼驗證**

- `npm test`：119 個測試全部通過，含既有的 AC-12 結構檢查（每檔 ≤400 行；本次新檔最大 178 行）與 `js/core` 不碰 DOM 的檢查（本任務沒有新增 core 檔案）。
- `node --check` 對所有新增/修改的 js 檔案做語法檢查，全部通過。
- 用 `python3 -m http.server` 起本機伺服器，確認 `index.html`、`js/main.js` 與本任務新增的每個檔案都能以 200 取得（無路徑/檔名錯誤）。
- 無法在此環境跑瀏覽器（headless Chrome 在此 sandbox 會卡住逾時），所以匯出 PNG／複製圖片／範本庫實際操作、AC-6 同網域讀舊版 localStorage、AC-7 新舊範本檔互相匯入、AC-8 內建範本等**仍需要依 docs/REGRESSION.md 的步驟做一次瀏覽器驗證**（e2e 角色或人工），程式邏輯已逐行比對舊版等價搬移。

**已知限制**

- `library.js` 的「存成範本」記住的「上次資料夾」與 `savetpl.js` 的「上次資料夾」是各自獨立的模組內變數（舊版是同一個 `lib.lastFolder`），因為兩個 UI 模組依規則不互相 import；功能上兩邊都能正確存取/選資料夾，只是「預設選到上次用的資料夾」這個小方便各自記憶，不共用。
- 共享區（「學校共用」分頁）完全沒有實作，只留 `#libNavShared` 空容器與程式註解給 008；008 接手時需同時把 `library-store.js` 換成雲端版本（登入時切換）。
- 尚未在真實瀏覽器驗證 AC-5／AC-6／AC-7／AC-8（見上「怎麼驗證」）。
