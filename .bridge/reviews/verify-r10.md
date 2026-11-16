# 端到端驗收報告（第 10 輪）

- **驗收者**：`antigravity_ide`
- **啟動方式**：本機靜態伺服器（`http.server`）＋ Headless Chrome（CDP `Input.dispatchTouchEvent` / `Emulation` / `Network`）＋ Firebase Auth／Firestore Emulator（`firebase emulators:exec --project demo-pe-board --only auth,firestore`）＋ Node 單元測試（`npm test` 147 項）＋ Firestore 規則測試（`npm run test:rules` 9 項）
- **證據目錄**：`.bridge/evidence/verify-r10/`

## 驗收結果總表

| AC | 結果 | 證據 | 備註 |
|---|---|---|---|
| AC-1 | ✅ | evidence/verify-r10/AC-1.png | 14 種場地切換與 SVG 繪製皆正確，`npm test`（`render.golden.test.js`）與舊版逐字相同 |
| AC-2 | ✅ | evidence/verify-r10/AC-2.png | 20 個物件（學生五色、老師、10 種器材、文字、3 種路線、區域）之放置、選取、拖曳移動、刪除皆正常 |
| AC-3 | ✅ | evidence/verify-r10/AC-3.png | 桌機快捷鍵 `S`/`T`/`C`/`B`/`X`/`R`/`P`/`D`/`Z`/`V`、`Ctrl+Z`、`Ctrl+Shift+Z`、`Esc`、`Delete` 行為皆正確 |
| AC-4 | ✅ | evidence/verify-r10/AC-4.png | 3 步驟增刪切換、步驟名稱與說明編輯、動畫 `2×` 播放正常；`anim.golden.test.js` 通過 |
| AC-5 | ✅ | evidence/verify-r10/AC-5.png | 「目前步驟」（`2160×2412`）與「全部步驟＋說明」（`2160×6576`）匯出 PNG 正常；`export.golden.test.js` 通過（貼入 Google 文件需真機人工確認） |
| AC-6 | ✅ | evidence/verify-r10/AC-6.png | 同網域寫入舊版 `pe-board-v1` 與 `pe-board-mytpl-v1`，重開首頁完整出現教案、我的範本與資料夾 |
| AC-7 | ✅ | evidence/verify-r10/AC-7.png | 舊版 `{ app: 'pe-board', version: 1, templates: [...] }` 匯入成功並顯示於「我的範本」；`tplfile.test.js` 往返測試通過 |
| AC-8 | ✅ | evidence/verify-r10/AC-8.png | 內建範本 8 個皆列出並可套用「三人傳切上籃」；`templates.golden.test.js` 通過 |
| AC-9 | ✅ | evidence/verify-r10/AC-9.png | 深色模式（`prefers-color-scheme: dark`）配色（背景 `rgb(16, 23, 26)`、文字 `rgb(228, 235, 233)`）與可讀性正常 |
| AC-10 | ✅ | evidence/verify-r10/AC-10.png | 純靜態 ES modules 零建置步驟、`.nojekyll` 存在、`pe-board.html` 轉址至 `/`、無 page error（iPadOS Safari 實機另由人工確認） |
| AC-11 | ✅ | evidence/verify-r10/AC-11.png | 靜態伺服器開啟首頁與全部功能正常，`README.md` 已載明 `python3 -m http.server 8000` |
| AC-12 | ✅ | evidence/verify-r10/AC-12.png | `tests/unit/structure.test.js` 檢查通過，`js/` 與 `css/` 單檔均 ≤ 400 行且 `js/core/` 不碰 DOM／storage／Firebase |
| AC-13 | ✅ | evidence/verify-r10/AC-13.png | `npm test` 147 項單元測試（含任務 020 新增之離線讀取測試與 `gesture.test.js`）全數通過，不需建置步驟 |
| AC-14 | ✅ | evidence/verify-r10/AC-14.png | iPad 橫向（`1024×768`）與直向（`768×1024`，`pointer: coarse`）無水平捲軸、畫布與工具列同時可見、所有可見按鈕 ≥ 44×44 px |
| AC-15 | ✅ | evidence/verify-r10/AC-15.png | Headless Chrome CDP 實測：選取工具空白處無 `app-gesture`（`touch-action: pan-x pan-y`），單指上滑時 `touchstart` 未被 `preventDefault`（`pd=0`）、頁面原生捲動 `scrollY: 0 → 48`、`#board` 重建次數 `0`、不誤清選取；單指點擊空白處取消選取；單指拖曳物件（`45.0px`）與 `p2` 把手（命中區 `44.0px`、移動 `30.0px`）時 `touchstart`/`touchmove` 皆有 `preventDefault`；只改高度不重繪 `#board`；放置工具加上 `app-gesture` 並攔截 `touchstart`。（依 DECISIONS 2026-11-16，AC-14～18 仍須以使用者 iPad 實機結果為準） |
| AC-16 | ✅ | evidence/verify-r10/AC-16.png | 純觸控操作 `#btnTouchDup`、`#btnTouchMulti`（切出 `app-gesture`）、`#btnTouchDel`、`#btnUndo`、`#btnRedo` 皆正常 |
| AC-17 | ✅ | evidence/verify-r10/AC-17.png | `js/ui/touch.js` `visualViewport` resize 防遮擋邏輯存在（實體 iPad 螢幕鍵盤行為須真機人工確認） |
| AC-18 | ✅ | evidence/verify-r10/AC-18.png | 雙指捏合縮放 `viewBox` 寬度 `1000.0 → 366.7` 並套用 `app-gesture`；單指平移 `viewBox` 更新且 `touchstart` 有 `preventDefault`；縮放期間匯出 PNG 尺寸不變（`2160×2412`）；按「縮放 100%」復原為 `1000` 並移除 `app-gesture` |
| AC-19 | ✅ | evidence/verify-r10/AC-19.png | 未登入開啟共享區可瀏覽、關鍵字搜尋（`測試共享`）並顯示已發布範本，不要求登入 |
| AC-20 | ✅ | evidence/verify-r10/AC-20.png | 未登入按「發布目前教案」跳出 `#loginPromptModal`，登入完成後保留編輯中教案標題「測試共享教案」並自動進入發布確認 |
| AC-21 | ✅ | evidence/verify-r10/AC-21.png | 透過 Auth Emulator 彈窗完成 2 次點擊登入，頂端顯示使用者名稱（`Panda Peach`）與「登出」 |
| AC-22 | ✅ | evidence/verify-r10/AC-22.png | 發布後不重整頁面即見於共享區，登出後仍可讀取；`npm run test:rules` AC-22 通過 |
| AC-23 | ✅ | evidence/verify-r10/AC-23.png | 作者顯示「更新為目前教案」「刪除」，未登入端不顯示；`npm run test:rules` AC-23 通過 |
| AC-24 | ✅ | evidence/verify-r10/AC-24.png | `npm run test:rules` AC-24 與 `config.test.js` 名單一致性測試通過 |
| AC-25 | ✅ | evidence/verify-r10/AC-25.png | `npm run test:rules` AC-25 通過（未登入對後端寫入一律拒絕） |
| AC-26 | ✅ | evidence/verify-r10/AC-26.png | 共享區無資料時顯示說明文字與「看內建範本」「發布第一個範本」按鈕 |
| AC-27 | ✅ | evidence/verify-r10/AC-27.png | 任務 020 修正後重測兩種離線情境皆通過：① 冷快取／CDN 無法連線時顯示「暫時連不到共享區」（`AC-27-cold.png`）；② 頁面已載入且 Firebase SDK 已快取後在 DevTools Network 設為 Offline，`cloud.js` 改用 `getDocsFromServer` 拋出 `unavailable` 並轉為 `{ offline: true }`，共享區正確顯示「暫時連不到共享區。」與重試按鈕（`AC-27.png`），畫圖與本機功能皆正常 |
| AC-28 | ✅ | evidence/verify-r10/AC-28.png | `npm test`（`planFirstUpload`、`planFolderMerge`）與 `npm run test:rules` AC-28 通過 |
| AC-29 | ✅ | evidence/verify-r10/AC-29.png | `npm test`（`filterShared`、`config.test.js` 索引檢查）與 `npm run test:rules` AC-29 通過 |

## 真機人工複查提醒

依 `.bridge/DECISIONS.md`（2026-11-16）與 `docs/REGRESSION.md`，以下項目無法在 Headless Chrome 完全取代，須於檢查點 3 由使用者在實體裝置確認：
- iPad 實機 Safari 原生捲動、雙指縮放、螢幕鍵盤遮擋與轉址登入（AC-10、AC-14～18、AC-21）
- 匯出「複製圖片」實際貼入 Google 文件（AC-5）
- 正式環境 GitHub Pages＋Firebase 複合索引篩選與跨裝置即時同步（AC-22、AC-29）

VERDICT: PASS
