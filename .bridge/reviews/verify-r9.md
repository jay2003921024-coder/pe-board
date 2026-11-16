# 端到端驗收報告（第 9 輪）

- **驗收者**：`antigravity_ide`
- **啟動方式**：本機靜態伺服器（`http.server`）＋ Headless Chrome（CDP `Input.dispatchTouchEvent` / `Emulation` / `Network`）＋ Firebase Auth／Firestore Emulator（`firebase emulators:exec --project demo-pe-board --only auth,firestore`）＋ Node 單元測試（`npm test` 146 項）＋ Firestore 規則測試（`npm run test:rules` 9 項）
- **證據目錄**：`.bridge/evidence/verify-r9/`

## 驗收結果總表

| AC | 結果 | 證據 | 備註 |
|---|---|---|---|
| AC-1 | ✅ | evidence/verify-r9/AC-1.png | 14 種場地切換與 SVG 繪製皆正確，`npm test`（`render.golden.test.js`）與舊版逐字相同 |
| AC-2 | ✅ | evidence/verify-r9/AC-2.png | 20 個物件（學生五色、老師、10 種器材、文字、3 種路線、區域）之放置、選取、拖曳移動、刪除皆正常 |
| AC-3 | ✅ | evidence/verify-r9/AC-3.png | 桌機快捷鍵 `S`/`T`/`C`/`B`/`X`/`R`/`P`/`D`/`Z`/`V`、`Ctrl+Z`、`Ctrl+Shift+Z`、`Esc`、`Delete` 行為皆正確 |
| AC-4 | ✅ | evidence/verify-r9/AC-4.png | 3 步驟增刪切換、步驟名稱與說明編輯、動畫 `2×` 播放正常；`anim.golden.test.js` 通過 |
| AC-5 | ✅ | evidence/verify-r9/AC-5.png | 「目前步驟」（`2160×2412`）與「全部步驟＋說明」（`2160×6576`）匯出 PNG 正常；`export.golden.test.js` 通過（貼入 Google 文件需真機人工確認） |
| AC-6 | ✅ | evidence/verify-r9/AC-6.png | 同網域寫入舊版 `pe-board-v1` 與 `pe-board-mytpl-v1`，重開首頁完整出現教案、我的範本與資料夾 |
| AC-7 | ✅ | evidence/verify-r9/AC-7.png | 舊版 `{ app: 'pe-board', version: 1, templates: [...] }` 匯入成功並顯示於「我的範本」；`tplfile.test.js` 往返測試通過 |
| AC-8 | ✅ | evidence/verify-r9/AC-8.png | 內建範本 8 個皆列出並可套用「三人傳切上籃」；`templates.golden.test.js` 通過 |
| AC-9 | ✅ | evidence/verify-r9/AC-9.png | 深色模式（`prefers-color-scheme: dark`）配色（背景 `rgb(16, 23, 26)`、文字 `rgb(228, 235, 233)`）與可讀性正常 |
| AC-10 | ✅ | evidence/verify-r9/AC-10.png | 純靜態 ES modules 零建置步驟、`.nojekyll` 存在、`pe-board.html` 轉址至 `/`、無 page error（iPadOS Safari 實機另由人工確認） |
| AC-11 | ✅ | evidence/verify-r9/AC-11.png | 靜態伺服器開啟首頁與全部功能正常，`README.md` 已載明 `python3 -m http.server 8000` |
| AC-12 | ✅ | evidence/verify-r9/AC-12.png | `tests/unit/structure.test.js` 檢查通過，`js/` 與 `css/` 單檔均 ≤ 400 行且 `js/core/` 不碰 DOM／storage／Firebase |
| AC-13 | ✅ | evidence/verify-r9/AC-13.png | `npm test` 146 項單元測試（含新增 `tests/unit/gesture.test.js`）全數通過，不需額外建置步驟 |
| AC-14 | ✅ | evidence/verify-r9/AC-14.png | iPad 橫向（`1024×768`）與直向（`768×1024`，`pointer: coarse`）無水平捲軸、畫布與工具列同時可見、所有可見按鈕 ≥ 44×44 px |
| AC-15 | ✅ | evidence/verify-r9/AC-15.png | 任務 019 修正後於 Headless Chrome CDP 實測：① 選取工具＋非多選＋未放大時，空白處無 `app-gesture`（`touch-action: pan-x pan-y`），單指上滑時 `touchstart` 未被 `preventDefault`（`pd=0`）、頁面原生捲動 `scrollY: 0 → 48`、`#board` 重建次數 `0`、不誤清選取；② 單指點擊空白處取消選取；③ 單指拖曳物件（移動 `45.0px`）與 `p2` 把手（命中區 `44.0px`、移動 `30.0px`）時，`touchstart` 與 `touchmove` 皆有 `preventDefault`；④ 只改高度（模擬網址列伸縮）不重繪 `#board`（`hResizeRebuilds=0`）；⑤ 放置工具加上 `app-gesture`（`touch-action: none`）並攔截 `touchstart`。（註：依 DECISIONS 2026-11-16，AC-14～18 仍須以使用者 iPad 實機結果為準） |
| AC-16 | ✅ | evidence/verify-r9/AC-16.png | 純觸控操作 `#btnTouchDup`、`#btnTouchMulti`（切出 `app-gesture`）、`#btnTouchDel`、`#btnUndo`、`#btnRedo` 皆正常 |
| AC-17 | ✅ | evidence/verify-r9/AC-17.png | `js/ui/touch.js` `visualViewport` resize 防遮擋邏輯存在（實體 iPad 螢幕鍵盤行為須真機人工確認） |
| AC-18 | ✅ | evidence/verify-r9/AC-18.png | 雙指捏合縮放 `viewBox` 寬度 `1000.0 → 366.7` 並套用 `app-gesture`；單指平移 `viewBox` 更新且 `touchstart` 有 `preventDefault`；縮放期間匯出 PNG 尺寸不變（`2160×2412`）；按「縮放 100%」復原為 `1000` 並移除 `app-gesture` |
| AC-19 | ✅ | evidence/verify-r9/AC-19.png | 未登入開啟共享區可瀏覽、關鍵字搜尋（`測試共享`）並顯示已發布範本，不要求登入 |
| AC-20 | ✅ | evidence/verify-r9/AC-20.png | 未登入按「發布目前教案」跳出 `#loginPromptModal`，登入完成後保留編輯中教案標題「測試共享教案」並自動進入發布確認 |
| AC-21 | ✅ | evidence/verify-r9/AC-21.png | 透過 Auth Emulator 彈窗完成 2 次點擊登入，頂端顯示使用者名稱（`Panda Panda`）與「登出」 |
| AC-22 | ✅ | evidence/verify-r9/AC-22.png | 發布後不重整頁面即見於共享區，登出後仍可讀取；`npm run test:rules` AC-22 通過 |
| AC-23 | ✅ | evidence/verify-r9/AC-23.png | 作者顯示「更新為目前教案」「刪除」，未登入端不顯示；`npm run test:rules` AC-23 通過 |
| AC-24 | ✅ | evidence/verify-r9/AC-24.png | `npm run test:rules` AC-24 與 `config.test.js` 名單一致性測試通過 |
| AC-25 | ✅ | evidence/verify-r9/AC-25.png | `npm run test:rules` AC-25 通過（未登入對後端寫入一律拒絕） |
| AC-26 | ✅ | evidence/verify-r9/AC-26.png | 共享區無資料時顯示說明文字與「看內建範本」「發布第一個範本」按鈕 |
| AC-27 | ❌ | evidence/verify-r9/AC-27.png | 冷快取／CDN 被封鎖時正常顯示「暫時連不到共享區」；但當瀏覽器已快取 Firebase SDK（或頁面開啟後在 DevTools Network 勾選 Offline）時，`cloud.js:32` 的 `fs.getDocs` 會直接回傳空的快取快照而非拋錯，導致共享區錯誤顯示「共享區還沒有任何老師發布範本」，未顯示「暫時連不到共享區」 |
| AC-28 | ✅ | evidence/verify-r9/AC-28.png | `npm test`（`planFirstUpload`、`planFolderMerge`）與 `npm run test:rules` AC-28 通過 |
| AC-29 | ✅ | evidence/verify-r9/AC-29.png | `npm test`（`filterShared`、`config.test.js` 索引檢查）與 `npm run test:rules` AC-29 通過 |

---

## 失敗項目詳情與修復建議

### 1. AC-27（已開啟頁面或瀏覽器已快取 SDK 後離線，共享區顯示「尚無範本」而非「暫時連不到共享區」）

- **對應 AC**：AC-27
- **檔案與行號**：`js/store/cloud.js:32`（`listShared`）、`js/store/cloud.js:57`（`listMine`）
- **重現方式與觀察到的錯誤**：
  1. 在正常連線狀態開啟首頁（此時 `https://www.gstatic.com/firebasejs/12.19.0/firebase-*.js` 已寫入瀏覽器 HTTP 快取，且 `firebase.js` 完成初始化，狀態為 `ready`）。
  2. 在 Chrome DevTools → Network 勾選 `Offline`（模擬頁面開啟後斷網，或使用者先前開過網站後在無網路環境再開啟）。
  3. 點擊「範本庫 → 共享區」。
  4. Console 記錄 `@firebase/firestore: Could not reach Cloud Firestore backend ... [code=unavailable] ... The client will operate in offline mode`，但 `fs.getDocs(...)` 在 Firestore 進入離線模式後並未 reject，而是以本地空快取 resolve（`snap.docs = []`），導致 `listShared` 回傳 `{ ok: true, items: [], cursor: null, more: false }`，畫面顯示「共享區還沒有任何老師發布範本。發布後，其他老師打開共享區就看得到你的教案。」，而非預期的「暫時連不到共享區」提示。
- **建議修法**：
  1. 在 `js/store/cloud.js` 的 `listShared`（第 32 行）與 `listMine`（第 57 行）改用 `(fs.getDocsFromServer || fs.getDocs)(...)`（以及 `(fs.getDocFromServer || fs.getDoc)(...)`），強制向伺服器查詢；離線時 Firestore SDK 會直接拋出 `unavailable`，由現有的 `toCloudFailure` 轉成 `{ offline: true }`（同時在未實作 `getDocsFromServer` 的測試 mock 中維持相容）。
  2. 或在 `listShared` 補檢查：`if (snap.metadata?.fromCache && navigator?.onLine === false) throw { code: 'unavailable' };`（注意 `js/store/` 可依環境判斷，或由 `getDocsFromServer` 統一處理無快取與離線情形）。

VERDICT: FAIL
