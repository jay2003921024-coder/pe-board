---
id: 009
title: 建立 Firebase 專案、提供設定、部署規則、開 GitHub Pages
owner: human
status: todo
depends_on: [007]
reviewer:
attempts: 0
---

## 目標

由使用者本人完成需要帳號權限的設定，讓 010 可以做真實環境的部署與驗收。

## 涵蓋的驗收條件

- AC-10（GitHub Pages 網址可開啟）
- AC-22（真實 Firebase 專案存在，才能跨裝置驗證）

## 實作提示

1. 到 https://console.firebase.google.com 建立專案（Spark 免費方案即可，A5）。
2. 「Authentication → 登入方式」啟用 **Google**。
3. 「Firestore Database」建立資料庫（正式版模式、選離台灣近的區域，例如 `asia-east1`）。
4. 「專案設定 → 一般 → 你的應用程式」新增 **網頁應用程式**，複製 `firebaseConfig`（apiKey 等是公開設定，可以放進 repo）。
5. 決定管理員的 Google email（可多個）。
6. 在 GitHub 建立 repo、push（agent 不會 push），到「Settings → Pages」選 `main` 分支根目錄。記下網址（例如 `https://<帳號>.github.io/<repo>/`）。
7. 回 Firebase「Authentication → 設定 → 授權網域」加入 `<帳號>.github.io`。
8. 把以下資訊寫進本任務的交接筆記（或直接填入 `js/config/firebase-config.js` 與 `firestore.rules` 的管理員名單）：`firebaseConfig`、管理員 email、GitHub Pages 網址。
8a. 管理員名單請照 `firestore.rules` 中 `// ADMIN_EMAILS:BEGIN` ～ `// ADMIN_EMAILS:END` 的格式填（一行一個、單引號）；也可只寫在交接筆記，由 010 代填。
9. 部署規則與索引：`npx firebase-tools login` 後 `npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <專案 id>`（或交給 010 由 agent 準備指令後由你執行）。索引建立需要幾分鐘，Firebase 主控台「Firestore → 索引」顯示「已啟用」才算完成。

## 交接筆記

<!-- 填寫：firebaseConfig、管理員 email、GitHub Pages 網址、規則與索引是否已部署 -->
