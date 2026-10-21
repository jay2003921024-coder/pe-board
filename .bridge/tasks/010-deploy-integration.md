---
id: 010
title: 部署整合、README 完稿、舊網址轉址、回歸清單與實機驗證
owner: claude
status: todo
depends_on: [006, 008, 009]
reviewer: antigravity
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

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->
