# 決策紀錄

<!-- 格式：- YYYY-MM-DD｜決策｜理由｜誰 -->

- 2026-10-21：Gemini CLI 個人帳號無法登入，critic 與 claude 任務的 reviewer 改由 Antigravity（手動）擔任，gemini agent 停用。理由：保留不同 AI 的交叉審查。決定者：使用者（Jay），claude 修改 config.toml。
- 2026-10-21｜目錄分三層：`js/core/`（純邏輯，不碰 DOM/storage/Firebase）、`js/ui/`、`js/store/`；`ui/state.js` 為唯一可變狀態｜core 可直接用 Node 測；避免 UI 模組循環 import｜claude（planner）
- 2026-10-21｜舊版移到 `legacy/pe-board.html` 凍結，當 golden test 的參考答案；測試在 `node:vm` 執行舊版純函式段落，新模組輸出須逐字相同｜讓「與舊版相同」（AC-1、2、5、8）可機器驗證｜claude（planner）
- 2026-10-21｜單元測試用 Node 內建 `node:test`（Node ≥ 22），`npm test` 零依賴；不引入 jsdom、Playwright｜AC-13 不要建置步驟；DOM 部分以 REGRESSION 清單人工/E2E 驗證｜claude（planner）
- 2026-10-21｜Firebase 以 gstatic CDN 模組化 SDK（固定版本）動態 `import()` 載入，不在開機路徑上｜離線或 CDN 失敗時畫圖照常（AC-27）｜claude（planner）
- 2026-10-21｜登入用 `signInWithPopup`，被擋時退回 `signInWithRedirect`｜不離開頁面、2 次點擊（AC-20、21）｜claude（planner）
- 2026-10-21｜Firestore 結構：`shared/{id}`（公開讀；欄位 name、nameLower、court、grade、steps、docJson、authorUid、authorName、createdAt、updatedAt）、`users/{uid}`（folders）、`users/{uid}/templates/{tplId}`（只限本人）｜教案存 JSON 字串方便規則限制大小，並與檔案匯入共用 normalizeDoc；本機範本 id 當 doc id 讓首次上傳可重複執行｜claude（planner）
- 2026-10-21｜管理員以 `firestore.rules` 內的 email 名單（需 email_verified）判定；前端 `js/config/firebase-config.js` 的 `ADMIN_EMAILS` 只決定是否顯示「下架」，由單元測試確保兩份名單一致；下架＝刪除文件｜A4；不做管理介面與審核流程｜claude（planner）
- 2026-10-21｜畫布縮放平移用改 viewBox 實作，不用 CSS transform｜既有 `getScreenCTM()` 座標換算不必改；匯出與畫面縮放無關（AC-18）｜claude（planner）
- 2026-10-21｜移除舊版 `window.claude` Artifact 儲存路徑與「學校共用」分頁，由 Firebase 共享區取代｜GitHub Pages 沒有該環境；SPEC 非目標不搬移 Artifact 資料｜claude（planner）
- 2026-10-21｜建議 `[tests] command = "npm test"`（由使用者設定 config.toml）｜planner 不改 orchestrator 設定｜claude（planner）
- 2026-10-21｜antigravity 改用 agy headless（`--mode accept-edits`，不能跑 shell）負責挑戰計畫與審查；新增 antigravity_ide（IDE 內手動）負責瀏覽器驗收（e2e）｜照 ~/code/bridge-kit 範本，省去每次手動貼指示檔｜使用者（Jay）決定，claude 修改
- 2026-10-21｜〔plan-critique-1 §2.1，不採納主要建議〕golden test 仍在 `node:vm` 中直接執行 `legacy/pe-board.html` 的程式碼段落，不全面改成靜態 fixture｜靜態 fixture 本身也要靠「執行舊版程式碼」產生，複雜度沒有消失，只是移到產生腳本，且會在 repo 裡多出大量 SVG 字串、多一個「fixture 是否過期」的問題；legacy 已凍結，vm 執行是決定性的，每次只花毫秒級時間，不存在速度問題。採納其中指出的真問題：helper 固定先執行前導段（W/FONT/uid/f/esc）、閉包變數只注入最小欄位、加 smoke test；若某函式假環境過於複雜（> 約 20 行），該函式個別改用靜態 fixture｜claude（planner）
- 2026-10-21｜〔plan-critique-1 §2.2，部分採納〕保留「`ADMIN_EMAILS` 與 `firestore.rules` 名單一致」的單元測試，但 rules 內名單改為固定格式：`// ADMIN_EMAILS:BEGIN`／`END` 標記間的 `adminEmails()` 函式，一行一個單引號 email；測試只在標記間抓 email 字串｜兩份名單分開手改最容易不同步（前端顯示「下架」但後端拒絕，或反之），值得自動檢查；固定格式＋標記讓解析不受換行、註解影響。規則測試另外驗證管理員能刪除，兩者互補｜claude（planner）
- 2026-10-21｜〔plan-critique-1 §5.4，不採納〕`package.json` 的 `test:rules` 維持 `firebase emulators:exec …`，不改成 `npx firebase-tools …`｜firebase-tools 是 devDependency，`npm run` 執行時會把 `node_modules/.bin` 加進 PATH，不需全域安裝；改用 `npx firebase-tools` 在未 `npm install` 時會臨時下載最新版，反而讓版本不固定。npm script 以外的地方（README、手動驗證、部署指令）一律加 `npx`｜claude（planner）
- 2026-10-21｜〔plan-critique-1 §2.3〕`shared/{id}` 移除 `nameLower` 欄位（取代先前 Firestore 結構決策中的該欄位）｜搜尋在客戶端 `filterShared` 以 `.toLowerCase()` 比對，沒有後端前綴查詢需求；少一個要同步的冗餘欄位｜claude（planner）
- 2026-10-21｜〔plan-critique-1 §5.2〕Firebase 改為「畫布首次渲染後背景初始化」，每次開機呼叫 `getRedirectResult`；redirect 前待辦動作存 `sessionStorage` 的 `pe-board-resume`（修正先前「點擊後才載入」的延遲載入決策；仍不阻塞開機、不靜態 import）｜iPadOS Safari 退回 `signInWithRedirect` 時頁面會重新載入，若不在開機時初始化，回來會看似未登入；AC-20 需要回到原畫面並繼續發布｜claude（planner）
- 2026-10-21｜〔plan-critique-1 §5.3〕Firebase JS SDK 鎖定 12.19.0（gstatic CDN），版本號只定義在 `js/store/firebase.js` 一個常數｜12.x 最新穩定版；13.0.0 是 2026-10-07 才發布的大版本，先避開｜claude（planner）
- 2026-10-21｜〔plan-critique-1 §5.1〕新增 `firestore.indexes.json`（`shared`：`court ASC + createdAt DESC`），部署指令改為 `--only firestore:rules,firestore:indexes`｜依場地篩選＋依時間排序需要複合索引，否則正式環境查詢失敗；emulator 不檢查索引，010 須在正式網址實測｜claude（planner）
- 2026-10-21｜〔plan-critique-1 §3.1、§3.2〕原 003 拆為 003（外殼/渲染/步驟）與 011（互動/屬性/快捷鍵/動畫），依賴 003 → 011 → 004；006 改依賴 005、008｜單一任務範圍過大難以審查與定位回歸；006 須在共享區 UI 完成後才能一併做平板目視調整。新任務用 011 而非重排編號，避免改動其他任務的引用｜claude（planner）
- 2026-10-21｜〔plan-critique-1 §1.3〕資料夾雲端同步以 `planFolderMerge` 聯集合併後寫入，不直接覆蓋 `users/{uid}.folders`｜避免兩台裝置各自的資料夾互相覆蓋（AC-28）｜claude（planner）
- 2026-10-21｜`tests/helpers/legacy.js` 的 `loadLegacy(段落名稱[], {globals, seed})` 回傳 Proxy：讀屬性時在舊版閉包內 `eval(名稱)` 取值，不需逐一列出要匯出的名稱（可取到 `TEXT_MAX` 這種同一行多重宣告）；vm 內物件屬於另一個 realm，深比較前先 `structuredClone`｜helper 要被 002 擴充段落，避免每加一段就維護匯出清單｜claude
- 2026-10-21｜`iconSVG(type, { team = 'red', ballColor } = {})`：舊版讀閉包的 `ui.team`、`COURTS[doc.court].ball`，改由呼叫端傳入｜core 不讀全域狀態｜claude
- 2026-10-21｜claude 任務的 reviewer 改回 claude（config.toml reviewer_for 與各任務檔 reviewer 欄位）｜agy 無頭模式只要有一個指令未放行（例如臨時 node -e 檢查）就整份審查無輸出，無法穩定產生 review 檔；--sandbox 無效｜使用者（Jay）決定，claude 修改
- 2026-10-21｜`tests/helpers/legacy.js` 擴充：`snippets` 選項切出單一頂層宣告（給所在段落有 DOM 副作用的純函式，如 `normalizeDoc`）；Proxy 可設定屬性（`L.doc = d` 注入舊版讀的全域 doc）；`withSeed` 讓本 realm 的 `uid()` 與 vm 用同種子序列，範本與正規化結果連 id 逐字比對｜不需為 exportSVG／planTransition／normalizeDoc 做靜態 fixture｜claude
- 2026-10-21｜core API：`createHistory().undo/redo(currentJson)` 回傳要還原的 JSON（無則 null）；`parseSavedDoc` 合法時原樣回傳（同舊版，不正規化）；`parseTemplateFile` 回傳的 doc 已正規化，格式錯誤 throw、找不到範本回 `[]`｜history 不持有 doc，狀態仍只在 `ui/state.js`；匯入的 UI 只需分辨「讀不懂」與「找不到範本」兩種訊息｜claude
- 2026-10-21｜`js/ui/state.js` 以 `state` 物件持有可變狀態（`state.doc` 可被 restore 整個換掉），跨 UI 模組的呼叫走 `hooks`（renderBoard／renderSteps／renderProps／renderHint／renderTools／syncInputs／stopAnim，預設 no-op，由各模組 init 填入）；`main.js` 以 `inits` 陣列依序初始化｜UI 模組不互相 import、避免循環依賴；後續任務只需新增 hook 欄位與 init，不改既有模組｜claude
- 2026-10-21｜`index.html` 加上 `<!doctype html>` 與 `lang="zh-Hant"`（舊版沒有，直接開檔是 quirks mode）｜舊版設計時以 Claude 頁面外殼（標準模式）為準；headless 截圖比對版面一致｜claude
