# 端到端驗收報告（第 8 輪）

- **驗收者**：`antigravity_ide`
- **啟動方式**：Headless Chrome（CDP `Input.dispatchTouchEvent` 真實瀏覽器觸控事件序列、`MutationObserver` DOM 重繪監測、`window.scrollBy`/`window.scrollTo` 攔截量測）＋ Node 單元測試（143 項）
- **證據目錄**：`.bridge/evidence/verify-r8/`

## 驗收結果總表

| AC | 結果 | 證據 | 備註 |
|---|---|---|---|
| AC-1 | ✅ | evidence/verify-r8/AC-1.png | 14 種場地切換與 SVG 繪製皆正確，與舊版 golden test 100% 相同 |
| AC-2 | ✅ | evidence/verify-r8/AC-2.png | 全部 16 種工具（學生五色、老師、10 種器材、文字、跑動／傳球／運球線、區域）之建立、選取、拖曳、刪除與外觀皆與舊版一致 |
| AC-3 | ✅ | evidence/verify-r8/AC-3.png | 桌機快捷鍵 `V`/`S`/`T`/`C`/`B`/`X`/`R`/`P`/`D`/`Z`、`Ctrl+Z`、`Ctrl+Shift+Z`、`Esc`、`Delete` 行為與舊版相同 |
| AC-4 | ✅ | evidence/verify-r8/AC-4.png | 多步驟增刪切換、步驟名稱與說明編輯、動畫 `0.5×`／`1×`／`2×` 播放正常 |
| AC-5 | ✅ | evidence/verify-r8/AC-5.png | 「目前步驟」與「全部步驟＋說明」匯出 PNG 預覽與「複製圖片」正常 |
| AC-6 | ✅ | evidence/verify-r8/AC-6.png | 同網域自動讀取舊版 `pe-board-v1` 與 `pe-board-mytpl-v1` 資料完整無誤 |
| AC-7 | ✅ | evidence/verify-r8/AC-7.png | 舊版範本檔匯入與新版匯出／再匯入往返相等 |
| AC-8 | ✅ | evidence/verify-r8/AC-8.png | 8 個內建範本套用內容與舊版逐字相同 |
| AC-9 | ✅ | evidence/verify-r8/AC-9.png | 深色模式（`prefers-color-scheme: dark`）配色與文字可讀性正常 |
| AC-10 | ✅ | evidence/verify-r8/AC-10.png | 純靜態 ES modules 零建置步驟、`.nojekyll` 與 `pe-board.html` 轉址正常 |
| AC-11 | ✅ | evidence/verify-r8/AC-11.png | `python3 -m http.server` 一行指令啟動正常，README 已載明 |
| AC-12 | ✅ | evidence/verify-r8/AC-12.png | 38 個模組檔全部 ≤ 400 行，`js/core/` 無 DOM／storage／Firebase 依賴 |
| AC-13 | ✅ | evidence/verify-r8/AC-13.png | `npm test` 143 項單元測試（含 `inertiaStepper`、`clampScroll`、`edgeVelocity` 新增測試）全數通過 |
| AC-14 | ✅ | evidence/verify-r8/AC-14.png | iPad 橫向（1024×768）與直向（768×1024）無水平捲軸，線條端點與控制點外層命中圓 `43.95~43.97 CSS px`，`#board` `max-height` 使用 `calc(100svh - 230px)`（橫向 `538px`、直向 `794px`） |
| AC-15 | ✅ | evidence/verify-r8/AC-15.png | 任務 018 修正後實測：① 單指長按畫布空白處並帶 `< 8px` 微噪訊時，`scrollByCalls === 0`、`boardRebuilds === 0`、`contextmenu` 已攔截、`#board` 高度恆定為 `433.91px`；② 慢速滑動（每步 2px）跨越 8px 門檻時，速度取樣以比例 `k` 折算當幀位移（`vy = -0.041 px/ms`，未放大 4 倍），連續滑順跟手 |
| AC-16 | ✅ | evidence/verify-r8/AC-16.png | 頂端「復原」「重做」與觸控操作列「多選」「複製」「刪除」按鈕皆可純觸控完成 |
| AC-17 | ✅ | evidence/verify-r8/AC-17.png | `visualViewport` 螢幕鍵盤防遮擋邏輯正常 |
| AC-18 | ✅ | evidence/verify-r8/AC-18.png | 任務 018 以 `inertiaStepper`、`clampScroll`、`edgeVelocity` 修正後實測：① 接近底端向上快速滑動放手後，慣性滑行到達 `maxScrollY = 512` 當幀即回傳 `false` 立即停止（`atMaxCalls === 1`，不再空轉）；② 已在底端繼續向上滑動放手時 `edgeVelocity` 歸零（`inertiaScrollToCallsWhenAlreadyAtBottom === 0`）；③ 頁面中段垂直滑動帶微小水平偏移時不提早中斷（平滑滑行 `19` 幀）；④ 雙指捏合縮放與「縮放 100%」一鍵復原正常 |
| AC-19 | ✅ | evidence/verify-r8/AC-19.png | 未登入可瀏覽、搜尋、依場地篩選、預覽與套用共享區範本 |
| AC-20 | ✅ | evidence/verify-r8/AC-20.png | 未登入按發布提示登入，登入後保留編輯中教案並自動續接發布流程 |
| AC-21 | ✅ | evidence/verify-r8/AC-21.png | 最多 2 次點擊完成登入，頂端顯示使用者名稱與「登出」 |
| AC-22 | ✅ | evidence/verify-r8/AC-22.png | 發布後不重新整理頁面，未登入端重新開啟共享區即刻看到新範本、作者與時間 |
| AC-23 | ✅ | evidence/verify-r8/AC-23.png | 作者可修改刪除、非作者無按鈕且直接呼叫後端被規則拒絕 |
| AC-24 | ✅ | evidence/verify-r8/AC-24.png | 管理員顯示「下架」並可刪除，非管理員不顯示「下架」 |
| AC-25 | ✅ | evidence/verify-r8/AC-25.png | 未登入直接寫入後端一律被 `firestore.rules` 拒絕 |
| AC-26 | ✅ | evidence/verify-r8/AC-26.png | 共享區空狀態顯示說明文字、「看內建範本」與「發布第一個範本」按鈕 |
| AC-27 | ✅ | evidence/verify-r8/AC-27.png | 離線時畫圖、匯出、本機範本、檔案匯入匯出皆可用，共享區顯示離線提示 |
| AC-28 | ✅ | evidence/verify-r8/AC-28.png | 首次登入自動上傳本機範本並保留本機副本，資料夾聯集合併不互蓋 |
| AC-29 | ✅ | evidence/verify-r8/AC-29.png | 超過 50 個範本時支援「載入更多」分頁與依場地篩選 |

VERDICT: PASS

