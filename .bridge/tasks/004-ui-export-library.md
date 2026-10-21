---
id: 004
title: UI 拆分（二）：匯出 PNG、範本庫（內建／我的）、存成範本、檔案匯入匯出
owner: claude
status: todo
depends_on: [011]
reviewer: antigravity
attempts: 0
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

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->
