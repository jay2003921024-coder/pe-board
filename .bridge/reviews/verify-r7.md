# 端到端驗收報告（第 7 輪）

- **驗收者**：`antigravity_ide`
- **啟動方式**：Headless Chrome（CDP `Input.dispatchTouchEvent` 真實瀏覽器觸控事件序列、`MutationObserver` DOM 重繪監測、`window.scrollBy`/`window.scrollTo` 攔截量測）＋ Node 單元測試（137 項）
- **證據目錄**：`.bridge/evidence/verify-r7/`

## 驗收結果總表

| AC | 結果 | 證據 | 備註 |
|---|---|---|---|
| AC-1 | ✅ | evidence/verify-r7/AC-1.png | 14 種場地切換與 SVG 繪製皆正確，與舊版 golden test 100% 相同 |
| AC-2 | ✅ | evidence/verify-r7/AC-2.png | 全部工具（學生五色、老師、10 種器材、文字、跑動／傳球／運球線、區域）之建立、選取、拖曳、刪除與外觀皆與舊版一致 |
| AC-3 | ✅ | evidence/verify-r7/AC-3.png | 桌機快捷鍵 `V`/`S`/`T`/`C`/`B`/`X`/`R`/`P`/`D`/`Z`、`Ctrl+Z`、`Ctrl+Shift+Z`、`Esc`、`Delete` 行為與舊版相同 |
| AC-4 | ✅ | evidence/verify-r7/AC-4.png | 多步驟增刪切換、步驟名稱與說明編輯、動畫 `0.5×`／`1×`／`2×` 播放正常 |
| AC-5 | ✅ | evidence/verify-r7/AC-5.png | 「目前步驟」與「全部步驟＋說明」匯出 PNG 及「複製圖片」正常 |
| AC-6 | ✅ | evidence/verify-r7/AC-6.png | 同網域自動讀取舊版 `pe-board-v1` 與 `pe-board-mytpl-v1` 資料完整無誤 |
| AC-7 | ✅ | evidence/verify-r7/AC-7.png | 舊版範本檔匯入與新版匯出／再匯入往返相等 |
| AC-8 | ✅ | evidence/verify-r7/AC-8.png | 8 個內建範本套用內容與舊版逐字相同 |
| AC-9 | ✅ | evidence/verify-r7/AC-9.png | 深色模式（`prefers-color-scheme: dark`）配色與文字可讀性正常 |
| AC-10 | ✅ | evidence/verify-r7/AC-10.png | 純靜態 ES modules 零建置步驟、`.nojekyll` 與 `pe-board.html` 轉址正常 |
| AC-11 | ✅ | evidence/verify-r7/AC-11.png | `python3 -m http.server` 一行指令啟動正常，README 已載明 |
| AC-12 | ✅ | evidence/verify-r7/AC-12.png | 38 個模組檔全部 ≤ 400 行，`js/core/` 無 DOM／storage／Firebase 依賴 |
| AC-13 | ✅ | evidence/verify-r7/AC-13.png | `npm test` 137 項單元測試全數通過 |
| AC-14 | ✅ | evidence/verify-r7/AC-14.png | iPad 橫向（1024×768）與直向（768×1024）無水平捲軸，線條端點與控制點外層命中圓 `43.95~43.97 CSS px`、內層可見圓 `21.98~22.03 CSS px`，`#board` `max-height` 已改用 `calc(100svh - 230px)`（橫向 `538px`、直向 `794px`） |
| AC-15 | ❌ | evidence/verify-r7/AC-15.png | 任務 017 修正後，問題一（長按微噪訊 < 8px 時 `scrollByCalls === 0`、`contextmenu` 已攔截、`#board` 高度恆定為 `434px`）已通過；但問題二（慢速捲動跨越 8px 門檻瞬間 `dxClient = drag.accX; dyClient = drag.accY` 一次跳動 8px）與問題三（見 AC-18：`stopInertia()` 被 `startInertia` 下一行覆蓋失效）仍有缺陷 |
| AC-16 | ✅ | evidence/verify-r7/AC-16.png | 頂端「復原」「重做」與觸控操作列「多選」「複製」「刪除」按鈕皆可純觸控完成 |
| AC-17 | ✅ | evidence/verify-r7/AC-17.png | `visualViewport` 螢幕鍵盤防遮擋邏輯正常 |
| AC-18 | ❌ | evidence/verify-r7/AC-18.png | 任務 017 問題三（捲動到頁面底端時停止慣性）：`inertiaApplyScroll` 雖呼叫 `stopInertia()`，但 `startInertia` 的 `step(now)` 在呼叫 `apply()` 後下一行無條件執行 `inertiaFrame = requestAnimationFrame(step)`，把 `stopInertia()` 設的 `inertiaFrame = null` 立刻覆蓋，導致撞到底端 `maxScrollY = 486` 後慣性完全沒停，繼續空轉呼叫 `window.scrollTo(0, 486)` 達 33 次 |
| AC-19 | ✅ | evidence/verify-r7/AC-19.png | 未登入可瀏覽、搜尋、依場地篩選、預覽與套用共享區範本 |
| AC-20 | ✅ | evidence/verify-r7/AC-20.png | 未登入按發布提示登入，登入後保留編輯中教案並自動續接發布流程 |
| AC-21 | ✅ | evidence/verify-r7/AC-21.png | 最多 2 次點擊完成登入，頂端顯示使用者名稱與「登出」 |
| AC-22 | ✅ | evidence/verify-r7/AC-22.png | 發布後不重新整理頁面，未登入端重新開啟共享區即刻看到新範本、作者與時間 |
| AC-23 | ✅ | evidence/verify-r7/AC-23.png | 作者可修改刪除、非作者無按鈕且直接呼叫後端被規則拒絕 |
| AC-24 | ✅ | evidence/verify-r7/AC-24.png | 管理員顯示「下架」並可刪除，非管理員不顯示「下架」 |
| AC-25 | ✅ | evidence/verify-r7/AC-25.png | 未登入直接寫入後端一律被 `firestore.rules` 拒絕 |
| AC-26 | ✅ | evidence/verify-r7/AC-26.png | 共享區空狀態顯示說明文字、「看內建範本」與「發布第一個範本」按鈕 |
| AC-27 | ✅ | evidence/verify-r7/AC-27.png | 離線時畫圖、匯出、本機範本、檔案匯入匯出皆可用，共享區顯示離線提示 |
| AC-28 | ✅ | evidence/verify-r7/AC-28.png | 首次登入自動上傳本機範本並保留本機副本，資料夾聯集合併不互蓋 |
| AC-29 | ✅ | evidence/verify-r7/AC-29.png | 超過 50 個範本時支援「載入更多」分頁與依場地篩選 |

---

## 失敗項目詳情與修復建議

### 1. AC-18 / AC-15（任務 017 問題三：慣性滑行撞到底端時 `stopInertia()` 被下一行 `requestAnimationFrame` 覆蓋而失效）

- **對應 AC**：AC-18、AC-15
- **檔案與行號**：`js/ui/editor.js:58-66`、`js/ui/editor.js:82-89`、`js/ui/editor.js:103-110`
- **重現方式與實測數據**：
  1. 在 iPad 直向（`768×1024`，`maxScrollY = 486`）將頁面捲至接近底端（`scrollY = 436`），在 `#board` 右下半部單指快速向上滑動 32px（此時 `scrollY = 468 < 486`，尚未到底）後放開手指。
  2. 放開手指後啟動慣性滑行，當 `scrollY` 滑行到達底端 `486` 時，`inertiaApplyScroll`（第 88 行）偵測到 `nextY !== wantY` 並呼叫 `stopInertia()`（將 `inertiaFrame` 設為 `null`）。
  3. **關鍵錯誤**：`inertiaApplyScroll` 是由 `startInertia` 的 `step(now)` 第 63 行 `if (delta) apply(ux * delta, uy * delta);` 同步呼叫的；當 `apply()` 返回後，`step(now)` 第 64 行只檢查 `if (t >= stopAt)`（此時 `t < stopAt` 為 false），接著**第 65 行無條件執行 `inertiaFrame = requestAnimationFrame(step);`**，直接把 `stopInertia()` 剛設好的 `inertiaFrame = null` 覆蓋掉並排程下一幀！
  4. 實測攔截 `window.scrollTo` 結果：`scrollToCalls: 72`，其中到達 `scrollY === 486` 之後仍繼續對底端邊界重複呼叫 `window.scrollTo(0, 486)` 高達 **33 次**（`scrollToAtMaxCalls: 33`），慣性完全沒有在觸底時停止。
  5. **附帶邊界問題 A（`js/ui/editor.js:88`）**：`if (nextX !== wantX || nextY !== wantY) stopInertia();` 使用 `||`；當使用者在無水平捲軸（或 `scrollX` 已在 0）的頁面上垂直滑動時，只要手指帶有一點點水平分量（`dx !== 0` 且 `scrollX` 被夾在 0），`nextX !== wantX` 就會為 `true`，導致頁面還在垂直中段（`nextY === wantY`）就被誤判成撞牆而提前中斷垂直慣性。
  6. **附帶邊界問題 B（`js/ui/editor.js:107-108`）**：`startInertiaFromDrag` 檢查 `window.scrollY >= max.y` 與 `window.scrollY <= 0` 未預留 Retina 螢幕（`devicePixelRatio = 2`）的次像素四捨五入容差（iPad 上捲到底時 `window.scrollY` 可能為 `max.y - 0.5`）。
- **建議修法**：
  1. 在 `startInertia`（`js/ui/editor.js:58-66`）中，讓 `step(now)` 在呼叫 `apply` 前先把 `inertiaFrame = null`（或用區域旗標 `let stopped = false`，或讓 `apply` 回傳是否繼續），若 `apply` 內部呼叫了 `stopInertia()` 就不再執行 `requestAnimationFrame(step)`；或者在 `step(now)` 開頭先把 `inertiaFrame` 設為一個哨兵值，若 `apply()` 後 `inertiaFrame === null` 則直接 `return`。
  2. 在 `inertiaApplyScroll`（`js/ui/editor.js:82-89`）中，改為判斷「實際有移動需求的軸都已被夾住（或捲動後 `window.scrollX === prevX && window.scrollY === prevY`）」才呼叫 `stopInertia()`，例如：
     ```js
     const prevX = window.scrollX, prevY = window.scrollY;
     const max = scrollMax();
     const wantX = prevX - dx, wantY = prevY - dy;
     const nextX = Math.max(0, Math.min(max.x, wantX));
     const nextY = Math.max(0, Math.min(max.y, wantY));
     window.scrollTo(nextX, nextY);
     const clampedX = !dx || nextX !== wantX;
     const clampedY = !dy || nextY !== wantY;
     if (clampedX && clampedY) stopInertia();
     ```
  3. 在 `startInertiaFromDrag`（`js/ui/editor.js:107-108`）中，邊界比較加上 `1px` 容差：
     ```js
     if ((vx < 0 && window.scrollX >= max.x - 1) || (vx > 0 && window.scrollX <= 1)) vx = 0;
     if ((vy < 0 && window.scrollY >= max.y - 1) || (vy > 0 && window.scrollY <= 1)) vy = 0;
     ```

### 2. AC-15（任務 017 問題二：慢速捲動跨越 8px 門檻瞬間一次跳動 8px）

- **對應 AC**：AC-15
- **檔案與行號**：`js/ui/editor.js:299-305`
- **重現方式與實測數據**：
  1. 在 `panMove(e, drag)` 中：
     ```js
     if (!drag.confirmed) {
       drag.accX = (drag.accX || 0) + dxClient;
       drag.accY = (drag.accY || 0) + dyClient;
       if (Math.hypot(drag.accX, drag.accY) < 8) return;
       drag.confirmed = true;
       dxClient = drag.accX; dyClient = drag.accY;
     }
     ```
  2. 當使用者慢速滑動（例如每幀移動 2px）時，前 3 幀（累積 6px）畫面不動，第 4 幀累積達 8px 時，因為把 `dxClient = drag.accX; dyClient = drag.accY;` 整包 8px 一次灌給 `window.scrollBy` 與 `trackVelocity`，導致起手瞬間會突兀跳動 8px（且初速取樣被放大 4 倍）。
- **建議修法**：
  跨越 8px 死區確認手勢時，扣除死區半徑 8px 的分量（只套用超出 8px 門檻的部分，或直接只套用當幀的 `dxClient, dyClient`）：
  ```js
  if (!drag.confirmed) {
    drag.accX = (drag.accX || 0) + dxClient;
    drag.accY = (drag.accY || 0) + dyClient;
    const dist = Math.hypot(drag.accX, drag.accY);
    if (dist < 8) return;
    drag.confirmed = true;
    const scale = (dist - 8) / dist;
    dxClient = drag.accX * scale;
    dyClient = drag.accY * scale;
  }
  ```

VERDICT: FAIL

