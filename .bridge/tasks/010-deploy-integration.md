---
id: 010
title: 部署整合、README 完稿、舊網址轉址、回歸清單與實機驗證
owner: claude
status: done
depends_on: [006, 008, 009]
reviewer: claude
attempts: 0
---

## 目標

接上 009 的真實設定，補齊部署所需檔案與文件，寫出逐條 AC 的回歸清單，並在真實 GitHub Pages 網址上做最後檢查。

## 涵蓋的驗收條件

- AC-10（Chrome、Safari（含 iPadOS）、Edge 開 GitHub Pages 網址即可使用，無建置步驟）
- AC-11（README 的一行本機啟動指令）
- AC-12（最終結構：各模組獨立、每檔 ≤ 400 行）
- AC-22（另一台未登入裝置 10 秒內看得到新發布的範本）

## 實作提示

- 把 009 交接筆記中的 `firebaseConfig`、管理員 email 填入 `js/config/firebase-config.js` 與 `firestore.rules`（照 `// ADMIN_EMAILS:BEGIN/END` 固定格式，`npm test` 的名單一致性測試要過）；`npm run test:rules` 要過。規則與索引部署指令：`npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <id>`（agent 不持有使用者的 Firebase 登入，需要時請使用者執行並在交接筆記回報）。
- 根目錄加 `.nojekyll`；根目錄 `pe-board.html` 改成轉址頁（`<meta http-equiv="refresh" content="0; url=./">`＋連結），保留舊書籤；確認所有資源路徑都是相對路徑（GitHub Pages 專案網址有 `/<repo>/` 前綴）。
- `legacy/` 會一起部署，確認它不會被當成主頁連結（可在 README 說明它是測試用參考檔）。
- README 完稿：功能簡介、`python3 -m http.server 8000`、`npm test`、`npm run test:rules`、部署步驟（Pages、Firebase 授權網域、規則部署指令）、從舊版（Claude Artifact 或其他網址）搬資料：在舊版「匯出範本檔」→新版「匯入範本檔」（A1）、管理員名單怎麼改。
- `docs/REGRESSION.md`：AC-1～AC-29 每條一節，寫「前置狀態 → 操作步驟 → 預期結果」，供 e2e 驗收（antigravity）與使用者照著點；標明哪些已由 `npm test` 自動覆蓋。每條另標「驗證者」：`npm test`／e2e（antigravity_ide）／**真機人工（使用者）**。至少下列標為真機人工：
  - AC-5「複製圖片」貼進 **Google 文件**（plan-critique-1 §1.4）：步驟寫明開 docs.google.com 新文件 → Ctrl/⌘+V → 圖片出現且內容正確；Chrome、Edge 各一次，Safari 若不支援 `ClipboardItem` 寫明退回訊息。
  - AC-17 螢幕鍵盤不遮擋（plan-critique-1 §6.1）：實體 iPad 上編輯文字物件標籤與步驟說明。
  - AC-10 iPadOS Safari 開啟、AC-21 iPad 上登入（含 redirect 退回路徑）。
- 在 Pages 網址上自測（可用 headless 瀏覽器或請使用者協助）：開啟無 console error、未登入瀏覽共享區、**依場地篩選共享區**（確認正式環境的複合索引已生效，不出現 `FAILED_PRECONDITION`）、登入發布、另一個無痕視窗 10 秒內看到（AC-22）。Safari/iPad 若 agent 無法操作，在交接筆記列為「需人工驗證」。
- 整體 E2E 視覺驗收（plan-critique-1 §4.2）：010 完成後由 e2e 角色 **antigravity_ide** 依 `docs/REGRESSION.md` 在瀏覽器逐條操作，截圖／錄影存 `.bridge/evidence/e2e/`。本任務負責讓清單可直接照做，不自己代替 e2e 驗收。
- 不要 `git push`（AGENTS.md）；需要 push 時在交接筆記請使用者執行。

## 交接筆記

**做了什麼**

1. 把 009 交接筆記的真實設定填入：
   - `js/config/firebase-config.js` 的 `FIREBASE_CONFIG`（apiKey/authDomain/projectId/appId）與 `ADMIN_EMAILS: ['jay2003921024@gmail.com']`。
   - `firestore.rules` 的 `ADMIN_EMAILS:BEGIN/END` 名單同步改成同一個 email（照固定格式，一行一個單引號 email）。
   - 規則與索引**尚未部署**（agent 不持有使用者的 Firebase 登入）；部署指令已整理進 README「部署」一節：`npx firebase-tools login` 後 `npx firebase-tools deploy --only firestore:rules,firestore:indexes --project pe-board-e2093`，**需要使用者本人執行**，完成後請在 Firebase 主控台「Firestore → 索引」確認狀態為「已啟用」。
2. 根目錄新增 `.nojekyll`（避免 GitHub Pages 用 Jekyll 處理，`_` 開頭的資源與目錄能被服務）。
3. 根目錄新增 `pe-board.html` 轉址頁（`<meta http-equiv="refresh" content="0; url=./">` ＋備援連結），保留舊書籤；確認過 `index.html`、`css/`、`js/` 都是相對路徑引用，適用於 GitHub Pages 專案網址的 `/pe-board/` 前綴（本機 `python3 -m http.server` 實測 `/`、`js/main.js`、`css/base.css`、`pe-board.html`、`.nojekyll`、`firestore.rules` 都回 200）。
4. README 完稿：功能簡介、本機啟動指令、`npm test`／`npm run test:rules`、部署步驟（Pages、Firebase 授權網域、規則與索引部署指令）、從舊版搬資料（同網域自動讀到；不同網域靠「舊版匯出範本檔→新版匯入」，對應 A1）、管理員名單怎麼改（兩處名單要同步＋ `npm test` 檢查＋重新部署規則）、更新目錄結構（補上 005～008、010 新增的模組與 `docs/REGRESSION.md`）、說明 `legacy/pe-board.html` 會一起部署但不是入口頁、不要分享它的連結。
5. 新增 `docs/REGRESSION.md`：AC-1～AC-29 逐條「前置狀態 → 操作步驟 → 預期結果」，每條標「驗證者」（`npm test`／e2e（antigravity_ide）／真機人工（使用者）），並依任務提示把 AC-5 複製圖片貼 Google 文件、AC-17 螢幕鍵盤、AC-10 iPadOS Safari、AC-21 iPad 登入（含 redirect）標為真機人工；文末附「正式環境自測」清單（Console 無 error、未登入瀏覽共享區、依場地篩選不出現 `FAILED_PRECONDITION`、登入發布、無痕視窗 10 秒內看到）。

**怎麼驗證**

- `npm test`：128 項全數通過（含 `config.test.js` 的 ADMIN_EMAILS 兩份名單一致性檢查、AC-12 結構檢查）。
- `npm run test:rules`：9 項全數通過（Java 21、`firebase emulators:exec`，涵蓋 AC-22、23、24、25、28、29）。
- 本機 `python3 -m http.server 8000`：手動以 `curl` 確認關鍵路徑回 200；另外用 `google-chrome --headless=new --dump-dom` 載入首頁，確認畫布（`#board`）、工具列（32 個按鈕）、頂端登入區都正常渲染，沙箱內沒有網路連到 Firebase CDN 時 `authArea` 正確顯示「登入中…」而不是整頁壞掉或拋錯（對應 AC-27 離線／CDN 失敗的優雅退化）。這個環境沒有瀏覽器可取得完整 DevTools console 日誌，只能確認 DOM 有正常渲染，不能完全等同「無 console error」的檢查。

**已知限制／需要人工處理**

- **規則與索引尚未部署到正式 Firebase 專案**：請使用者執行 README「部署」一節的指令（`npx firebase-tools login` → `npx firebase-tools deploy --only firestore:rules,firestore:indexes --project pe-board-e2093`），並在 Firebase 主控台確認索引狀態為「已啟用」。
- **`git push`**：本任務沒有推送，請使用者自行 push 到 GitHub（AGENTS.md 規定 agent 不 push）。
- **正式 GitHub Pages 網址自測**（`https://jay2003921024-coder.github.io/pe-board/`）尚未執行：agent 在此環境沒有對外網路與瀏覽器可直接開啟正式網址，需要 push＋規則部署完成後，由使用者或 e2e 角色依 `docs/REGRESSION.md`「正式環境自測」一節檢查：Console 無 error、未登入瀏覽共享區、依場地篩選（索引生效後才不會 `FAILED_PRECONDITION`）、登入發布、另一台無痕裝置 10 秒內看到（AC-22）。
- 以下項目在 `docs/REGRESSION.md` 中標記為「真機人工（使用者）」，agent 無法代為驗證：AC-5 複製圖片貼進 Google 文件（Chrome、Edge、Safari 各一次）、AC-10 iPadOS Safari 開啟、AC-17 螢幕鍵盤不遮擋、AC-21 iPad 上登入（含 popup 被擋退回 redirect 的路徑）。
- 整體瀏覽器 E2E 視覺驗收（含 iPad 裝置模擬截圖）依計畫由 **antigravity_ide** 在本任務之後依 `docs/REGRESSION.md` 執行，本任務未代替執行，只確保清單可直接照做。
