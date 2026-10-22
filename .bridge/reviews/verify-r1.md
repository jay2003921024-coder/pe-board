# 端到端驗收報告（第 1 輪）

- **驗收者**：`antigravity_ide`
- **啟動方式**：本機靜態伺服器 `python3 -m http.server` ＋ Chrome Headless (CDP E2E 瀏覽器實測與裝置模擬) ＋ Node 單元測試（128 項）＋ Firestore Emulator 規則與存取層測試（9 項）
- **證據目錄**：`.bridge/evidence/verify-r1/`（同步備份於 `.bridge/evidence/e2e/`）

## 驗收結果總表

| AC | 結果 | 證據 | 備註 |
|---|---|---|---|
| AC-1 | ✅ | evidence/verify-r1/AC-1.png | 瀏覽器逐一切換全部 14 種場地（籃球半／全場、排球、羽球、桌球、網球、足球、手球、躲避球、壘球、田徑、體育館、草地、游泳池），SVG 皆正確繪出；`render.golden.test.js` 與舊版逐字比對 100% 相同 |
| AC-2 | ✅ | evidence/verify-r1/AC-2.png | 瀏覽器實測學生五色（紅／藍／黃／綠／白）、老師、10 種器材、文字、跑動／傳球／運球線、區域共 20 個物件之建立、選取、拖曳移動、Delete 刪除與復原；外觀與舊版 golden test 完全一致 |
| AC-3 | ✅ | evidence/verify-r1/AC-3.png | 桌機瀏覽器實測快捷鍵 `V`/`S`/`T`/`C`/`B`/`X`/`R`/`P`/`D`/`Z` 切換工具、`Ctrl+Z` 復原、`Ctrl+Shift+Z` 重做、`Esc` 關閉彈窗／取消選取回選取工具、`Delete` 刪除選取物件，行為與舊版相同 |
| AC-4 | ✅ | evidence/verify-r1/AC-4.png | 3 步教案實測新增第 4 步、切換步驟分頁、編輯步驟名稱與活動說明、刪除步驟回 3 步，並點擊「▶ 播放動畫」切換 `0.5×`／`1×`／`2×` 速度，步驟字幕與平滑移動動畫正常；`anim.golden.test.js` 配對與路徑逐字相同 |
| AC-5 | ✅ | evidence/verify-r1/AC-5.png | 實測「目前步驟」與「全部步驟＋說明」（2160×6716 px PNG）匯出預覽與 `ClipboardItem`「複製圖片」成功；`export.golden.test.js` 比對 SVG 逐字相同（註：貼入 Google 文件之跨瀏覽器確認列於 `docs/REGRESSION.md` 供真機人工複查） |
| AC-6 | ✅ | evidence/verify-r1/AC-6.png | 同網域先開啟 `legacy/pe-board.html` 寫入 `pe-board-v1` 與 `pe-board-mytpl-v1`（含自訂資料夾），再開啟新版首頁，教案、我的範本與資料夾自動完整載入，不需額外操作 |
| AC-7 | ✅ | evidence/verify-r1/AC-7.png | 實測於「範本庫 → 我的範本」匯入舊版格式 `{ app: 'pe-board', version: 1, templates: [...] }` JSON 檔成功並可開啟；新版「匯出全部」產出之檔案亦可再匯入（往返相等） |
| AC-8 | ✅ | evidence/verify-r1/AC-8.png | 瀏覽器逐一套用全部 8 個內建範本，標題、場地、年段、步驟與物件皆與舊版相同（`templates.golden.test.js` 逐字驗證通過） |
| AC-9 | ✅ | evidence/verify-r1/AC-9.png | 模擬系統 `prefers-color-scheme: dark`，自動套用深色主題（背景 `rgb(16, 23, 26)`、文字 `rgb(228, 235, 233)`），主畫面、範本庫與共享區文字對比清晰可讀 |
| AC-10 | ✅ | evidence/verify-r1/AC-10.png | 純靜態 ES modules 零建置步驟、全相對路徑引用、根目錄含 `.nojekyll` 且 `pe-board.html` 自動轉址至 `./`；Chrome 實測無 console error（iPadOS Safari 實機開啟列於 `docs/REGRESSION.md` 真機人工項） |
| AC-11 | ✅ | evidence/verify-r1/AC-11.png | 本機以 `python3 -m http.server` 一行指令啟動並開啟全部功能正常，`README.md` 已明確記載該指令 |
| AC-12 | ✅ | evidence/verify-r1/AC-12.png | 檢視 `js/{core,ui,store,config}` 與 `css/` 共 38 個獨立模組檔，最大檔案為 `js/ui/library.js`（201 行），所有檔案均 ≤ 400 行，且 `js/core/` 完全不碰 DOM／storage／Firebase（`structure.test.js` 通過） |
| AC-13 | ✅ | evidence/verify-r1/AC-13.png | 執行 `npm test`（`node --test "tests/unit/**/*.test.js"`），128 項單元測試全數通過（0 失敗），不需建置步驟，涵蓋舊版資料正規化、範本檔匯入匯出、復原重做、動畫配對、縮放平移與共享純邏輯 |
| AC-14 | ✅ | evidence/verify-r1/AC-14.png | 模擬 iPad 橫向（1024×768）與直向（768×1024，`pointer: coarse`），確認 `scrollWidth <= innerWidth` 無水平捲軸、`#tools` 與 `#board` 同屏完整可見，且畫面上所有可見可點按鈕觸控區皆 ≥ 44×44 px（違規數 = 0） |
| AC-15 | ✅ | evidence/verify-r1/AC-15.png | 觸控模式（`pointerType: 'touch'`）下實測點選工具放置學生、拖曳移動、畫傳球線、拖曳線條端點與控制點、點空白處取消選取皆一次成功；全程 `scrollX/Y === 0`，`.canvas-wrap` 之 `gesturestart` 與 `dblclick` 均正確攔截 |
| AC-16 | ✅ | evidence/verify-r1/AC-16.png | 平板無鍵盤下透過頂端「復原」「重做」與觸控操作列（`#touchBar`）「多選」「複製」「刪除」按鈕，實測多選 2 個物件、整批複製成 4 個、刪除、復原、重做皆可純靠畫面按鈕完成 |
| AC-17 | ✅ | evidence/verify-r1/AC-17.png | 驗證 `js/ui/touch.js` 之 `scrollFocusedIntoView()` 在聚焦輸入欄且 `visualViewport` 高度收縮時自動呼叫 `scrollIntoView({ block: 'center' })`（實體 iPad 螢幕鍵盤彈出體驗列於 `docs/REGRESSION.md` 供真機人工確認） |
| AC-18 | ✅ | evidence/verify-r1/AC-18.png | 雙指觸控（2 個 touch pointer）捏合與拖曳實測 `#board` 之 `viewBox` 平滑縮放平移（`291.7 168.9 416.7 277.8`），按「縮放 100%」一鍵回到 `0 0 1000 666.7`，且縮放期間匯出 SVG/PNG 不受畫面縮放影響 |
| AC-19 | ✅ | evidence/verify-r1/AC-19.png | 未登入狀態下開啟「範本庫 → 共享區」，可正常瀏覽共享範本、依名稱關鍵字搜尋、依運動場地篩選、預覽 SVG 縮圖並點擊「開啟」套用，全程不要求登入 |
| AC-20 | ✅ | evidence/verify-r1/AC-20.png | 未登入編輯教案時按「發布目前教案」，彈出 `#loginPromptModal`（「需要登入」）；點擊登入完成後自動進入 `#publishModal` 發布確認視窗，且畫布與 localStorage 中的教案內容完整保留不遺失 |
| AC-21 | ✅ | evidence/verify-r1/AC-21.png | 點擊「登入」並選擇帳號（最多 2 次點擊）即完成 Google 登入，頂端 `#authArea` 立即顯示使用者名稱與「登出」按鈕 |
| AC-22 | ✅ | evidence/verify-r1/AC-22.png | 已登入狀態發布「王老師的三人快攻戰術」後不重新整理頁面，切換至未登入狀態重新開啟共享區即刻（< 1 秒）顯示該範本、作者名稱與發布時間；Firestore Emulator `test:rules` AC-22 同步驗證通過 |
| AC-23 | ✅ | evidence/verify-r1/AC-23.png | 已登入作者在共享區看到「更新為目前教案」「刪除」並可同步更新；非作者不顯示修改／刪除按鈕，且直接對後端發送修改或刪除請求均被 `firestore.rules` 拒絕（`permission-denied`，`test:rules` AC-23 通過） |
| AC-24 | ✅ | evidence/verify-r1/AC-24.png | 管理員帳號（`jay2003921024@gmail.com`，email 已驗證）在共享區顯示「下架」按鈕，點擊確認後範本立即從共享區消失；非管理員帳號不顯示「下架」按鈕；`test:rules` AC-24 與 `config.test.js` 名單一致性測試通過 |
| AC-25 | ✅ | evidence/verify-r1/AC-25.png | 未登入者嘗試直接對後端寫入 `shared`、`users`、`users/{uid}/templates` 等任何集合均被 `firestore.rules` 拒絕（`permission-denied`，`test:rules` AC-25 通過） |
| AC-26 | ✅ | evidence/verify-r1/AC-26.png | 共享區尚無任何範本時，顯示空狀態說明文字，並提供「看內建範本」與「發布第一個範本」兩個操作按鈕，非空白畫面 |
| AC-27 | ✅ | evidence/verify-r1/AC-27.png | 網路斷線／Firebase 無法連線時，畫圖、匯出圖片、本機「我的範本」讀寫、範本檔匯入匯出均照常可用；共享區顯示「暫時連不到共享區，其他功能不受影響，稍後可以按『重新整理』再試一次。」與重試按鈕 |
| AC-28 | ✅ | evidence/verify-r1/AC-28.png | 第一次登入時自動將本機既有「我的範本」上傳同步至雲端 Google 帳號（`users/{uid}/templates`），本機 `localStorage` 副本保留不刪，且資料夾以聯集合併不互蓋（`test:rules` AC-28 通過） |
| AC-29 | ✅ | evidence/verify-r1/AC-29.png | 共享區灌入 55 個範本時，首頁載入前 50 個並顯示「載入更多」按鈕，點擊後載入剩餘 5 個（共 55 個），並可依場地篩選（`firestore.indexes.json` 已定義 `court ASC + createdAt DESC` 複合索引，`test:rules` AC-29 通過） |

## 補充說明（供使用者於檢查點 3 Demo 確認）

1. **Firestore 規則與複合索引部署**：請在終端機執行 `npx firebase-tools deploy --only firestore:rules,firestore:indexes --project pe-board-e2093`，待 Firebase 主控台「Firestore → 索引」顯示「已啟用」後，即可於正式 GitHub Pages 網址（`https://jay2003921024-coder.github.io/pe-board/`）測試線上跨裝置共享與場地篩選。
2. **真機人工項目**：依 `docs/REGRESSION.md`，實體 iPad Safari 開啟與轉址登入（AC-10、AC-21）、實體 iPad 螢幕鍵盤彈出不遮擋（AC-17）、以及複製圖片貼入 Google 文件（AC-5）可於檢查點 3 實機試用時一併確認。

VERDICT: PASS

