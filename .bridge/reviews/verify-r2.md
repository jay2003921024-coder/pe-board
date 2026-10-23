# 端到端驗收報告（第 2 輪）

- **驗收者**：`antigravity_ide`
- **啟動方式**：本機靜態伺服器 `python3 -m http.server` ＋ Chrome Headless（CDP `Input.dispatchTouchEvent` 真實瀏覽器觸控手勢與合成器模擬）＋ Node 單元測試（128 項）
- **證據目錄**：`.bridge/evidence/verify-r2/`

## 驗收結果總表

| AC | 結果 | 證據 | 備註 |
|---|---|---|---|
| AC-1 | ✅ | evidence/verify-r2/AC-1.png | 14 種場地切換與 SVG 繪製皆正確，與舊版 golden test 100% 相同 |
| AC-2 | ✅ | evidence/verify-r2/AC-2.png | 桌機滑鼠下全部工具之建立、選取、拖曳、刪除與外觀皆與舊版一致（平板垂直觸控拖曳問題見 AC-15） |
| AC-3 | ✅ | evidence/verify-r2/AC-3.png | 桌機快捷鍵 `V`/`S`/`T`/`C`/`B`/`X`/`R`/`P`/`D`/`Z`、`Ctrl+Z`、`Ctrl+Shift+Z`、`Esc`、`Delete` 行為與舊版相同 |
| AC-4 | ✅ | evidence/verify-r2/AC-4.png | 多步驟增刪切換、步驟名稱與說明編輯、動畫 `0.5×`／`1×`／`2×` 播放正常 |
| AC-5 | ✅ | evidence/verify-r2/AC-5.png | 「目前步驟」與「全部步驟＋說明」匯出 PNG 及「複製圖片」正常 |
| AC-6 | ✅ | evidence/verify-r2/AC-6.png | 同網域自動讀取舊版 `pe-board-v1` 與 `pe-board-mytpl-v1` 資料完整無誤 |
| AC-7 | ✅ | evidence/verify-r2/AC-7.png | 舊版範本檔匯入與新版匯出／再匯入往返相等 |
| AC-8 | ✅ | evidence/verify-r2/AC-8.png | 8 個內建範本套用內容與舊版逐字相同 |
| AC-9 | ✅ | evidence/verify-r2/AC-9.png | 深色模式（`prefers-color-scheme: dark`）配色與文字可讀性正常 |
| AC-10 | ✅ | evidence/verify-r2/AC-10.png | 純靜態 ES modules 零建置步驟、`.nojekyll` 與 `pe-board.html` 轉址正常 |
| AC-11 | ✅ | evidence/verify-r2/AC-11.png | `python3 -m http.server` 一行指令啟動正常，README 已載明 |
| AC-12 | ✅ | evidence/verify-r2/AC-12.png | 38 個模組檔全部 ≤ 400 行，`js/core/` 無 DOM／storage／Firebase 依賴 |
| AC-13 | ✅ | evidence/verify-r2/AC-13.png | `npm test` 128 項單元測試全數通過 |
| AC-14 | ✅ | evidence/verify-r2/AC-14.png | iPad 橫向（1024×768）與直向（768×1024）無水平捲軸、工具列與畫布同屏可見、所有可點按鈕 ≥ 44×44 px |
| AC-15 | ❌ | evidence/verify-r2/AC-15.png | 任務 012 改為 `touch-action: pan-y` 後，因 `renderBoard()` 的 `board.innerHTML = ...` 將觸控目標節點從 DOM 移除，`touchmove` 無法冒泡至 `#board`，導致垂直方向畫線、拖曳物件、拖曳把手移動約 15px 後即觸發瀏覽器 `pointercancel` 中斷操作 |
| AC-16 | ✅ | evidence/verify-r2/AC-16.png | 頂端「復原」「重做」與觸控操作列「多選」「複製」「刪除」按鈕皆可純觸控完成 |
| AC-17 | ✅ | evidence/verify-r2/AC-17.png | `visualViewport` 螢幕鍵盤防遮擋邏輯正常 |
| AC-18 | ❌ | evidence/verify-r2/AC-18.png | 任務 012 的 `pinchMove()` 改用 `board.getBoundingClientRect()` 計算相對位置，但在 iPad 橫向（1024×768）下如「籃球半場（`bb-half`）」「壘球場（`softball`）」因 `#board` 受 `max-height` 限制產生左右留白（`rect.width = 714` 但實際繪製寬度為 `567.9`），雙指原地放大時中心錨點仍會水平偏移 `21.8` 場地單位；且雙指垂直平移時同樣受 `e.target` 脫離 DOM 影響無法呼叫 `preventDefault()` |
| AC-19 | ✅ | evidence/verify-r2/AC-19.png | 未登入可瀏覽、搜尋、依場地篩選、預覽與套用共享區範本 |
| AC-20 | ✅ | evidence/verify-r2/AC-20.png | 未登入按發布提示登入，登入後保留編輯中教案並自動續接發布流程 |
| AC-21 | ✅ | evidence/verify-r2/AC-21.png | 最多 2 次點擊完成登入，頂端顯示使用者名稱與「登出」 |
| AC-22 | ✅ | evidence/verify-r2/AC-22.png | 發布後不重新整理頁面，未登入端重新開啟共享區即刻看到新範本、作者與時間 |
| AC-23 | ✅ | evidence/verify-r2/AC-23.png | 作者可修改刪除、非作者無按鈕且直接呼叫後端被規則拒絕 |
| AC-24 | ✅ | evidence/verify-r2/AC-24.png | 管理員顯示「下架」並可刪除，非管理員不顯示「下架」 |
| AC-25 | ✅ | evidence/verify-r2/AC-25.png | 未登入直接寫入後端一律被 `firestore.rules` 拒絕 |
| AC-26 | ✅ | evidence/verify-r2/AC-26.png | 共享區空狀態顯示說明文字、「看內建範本」與「發布第一個範本」按鈕 |
| AC-27 | ✅ | evidence/verify-r2/AC-27.png | 離線時畫圖、匯出、本機範本、檔案匯入匯出皆可用，共享區顯示離線提示 |
| AC-28 | ✅ | evidence/verify-r2/AC-28.png | 首次登入自動上傳本機範本並保留本機副本，資料夾聯集合併不互蓋 |
| AC-29 | ✅ | evidence/verify-r2/AC-29.png | 超過 50 個範本時支援「載入更多」分頁與依場地篩選 |

---

## 失敗項目詳細說明與建議修法

### 1. AC-15：平板觸控垂直方向畫線、拖曳物件、拖曳把手會被 `pointercancel` 中斷

- **對應 AC**：AC-15（「Given 平板只用手指，When 點選工具後點畫布放置物件、拖曳物件、拖曳線條端點與控制點、點空白處取消選取，Then 都能一次成功，不會誤觸成捲動頁面或放大頁面」）
- **檔案與行號**：
  - `css/layout.css:60`（`#board { ... touch-action: pan-y; ... }`）
  - `css/touch.css:6`（`.canvas-wrap { touch-action: pan-y }`）
  - `js/ui/editor.js:88-146`（`onPointerDown`）、`js/ui/editor.js:148-178`（`onPointerMove`）、`js/ui/editor.js:199-201, 209`（`onTouchMove`）
  - `js/ui/board.js:62`（`board.innerHTML = ...`）
- **重現方式**：
  1. 在開啟觸控模擬的瀏覽器（或實體平板）開啟首頁，切換為任意物件工具（如「學生」）、線條工具（如「傳球」），或以「選取」工具點選場上既有物件／線條端點把手（`p1`/`p2`/`c`）。
  2. 用單指在 `#board` 上往下（或往上）垂直滑動 150px（以 CDP `Input.dispatchTouchEvent` 發送真實 `touchStart` → 連續垂直 `touchMove` → `touchEnd`）。
  3. **觀察到的錯誤**：手指垂直移動僅約 2～6 幀（約 15px，超過瀏覽器垂直捲動閾值）後，`#board` 立即收到瀏覽器發出的 `pointercancel` 事件（`boardLog: ['pointerdown', 'pointermove', 'pointermove', 'pointercancel']`），`onTouchMove` 完全沒有被觸發（0 次），導致：
     - 垂直畫傳球／跑動／運球線時，線條只畫出極短截斷線段（若 `pointercancel` 時長度 `< 10` 還會被 `endDrag` 第 188 行直接刪除）；
     - 垂直拖曳既有物件或線條端點／控制點把手時，拖曳在 ~15px 處直接中止，頁面轉為原生垂直捲動。
- **根因分析**：
  - 瀏覽器事件派發順序為 `pointerdown` → `touchstart` → `pointermove` → `touchmove`。
  - 在 `onPointerDown`（`js/ui/editor.js:117, 124, 136, 145`）或第一次 `onPointerMove`（拖曳把手時，`js/ui/editor.js:177`）中，程式呼叫了 `hooks.renderBoard()`（`js/ui/board.js:62`），執行 `board.innerHTML = boardContent(...) + overlay()`。
  - `board.innerHTML = ...` 會在 `pointerdown`／第一次 `pointermove` 當下**銷毀並替換 `#board` 內的所有 SVG 子節點**，導致手指最初命中的目標元素 `e.target`（例如 `<rect>`、`<path>`、`<circle>`）脫離 DOM 樹（`document.contains(e.target) === false`）。
  - 依 W3C Touch Events 規範，同一根手指後續的 `touchstart` 與 `touchmove` 事件固定派發給最初命中的 `Touch.target` 節點。由於該節點已脫離 `#board`（成為孤立節點），`touchmove` 事件**無法沿 DOM 樹冒泡到 `#board`**，因此綁在 `#board` 上的 `board.addEventListener('touchmove', onTouchMove, { passive: false })`（`js/ui/editor.js:209`）永遠不會執行，`e.preventDefault()` 不會被呼叫，瀏覽器便依 `touch-action: pan-y` 啟動垂直捲動並發出 `pointercancel`。
- **建議修法**：
  - 在 `js/ui/editor.js` 的 `onPointerDown(e)` 開頭（呼叫任何 `hooks.renderBoard()` 之前，例如第 92 行 `if (e.pointerType === 'touch')` 區塊內），將 `onTouchMove` 同時綁定到當下命中的 `e.target` 上：
    ```js
    if (e.pointerType === 'touch') {
      if (e.target && e.target !== board) {
        e.target.addEventListener('touchmove', onTouchMove, { passive: false });
      }
      ...
    ```
  - 這樣即使 `e.target` 隨後被 `board.innerHTML = ...` 從 DOM 替換下來，瀏覽器派發給該 `Touch.target` 的 `touchmove` 仍會觸發 `onTouchMove`：當 `state.drag` 有值（畫圖、拖曳物件、拖曳把手、多選框選、雙指縮放）時呼叫 `e.preventDefault()` 阻止 `pointercancel`；當觸控且非多選模式點在空白處時 `state.drag` 為 `null`，不呼叫 `preventDefault()`，維持單指在空白處垂直滑動可捲動頁面的效果。

---

### 2. AC-18：雙指縮放在觸發 `max-height` 留白的場地上中心點仍會偏移

- **對應 AC**：AC-18（「Given 平板，When 在畫布上雙指捏合／拖曳，Then 畫布縮放與平移，放開後可一鍵回到原尺寸；匯出圖片不受縮放影響」）及檢查點 3 回饋（「放大時沒有以手指捏合的位置為中心」）
- **檔案與行號**：
  - `js/ui/editor.js:61-86`（`pinchMove`）
  - `css/layout.css:60`（`#board { width: 100%; height: auto; max-height: 74vh; ... }`）
  - `css/touch.css:26`（`#board { max-height: calc(100vh - 230px) }`）
- **重現方式**：
  1. 在 iPad 橫向（`1024×768`，`pointer: coarse`）開啟首頁，將場地切換為「籃球（半場）`bb-half`」（比例 `1000×947.4`）或「壘球場 `softball`」（比例 `1000×800`）。
  2. 此時 `#board` 高度受 `max-height: calc(100vh - 230px)`（`538px`）限制，`board.getBoundingClientRect()` 的外框寬高為 `714 × 538`，但 SVG 內部因預設 `preserveAspectRatio="xMidYMid meet"` 置中縮放，實際繪製的場地寬度只有 `567.9px`（左右各有 `73.1px` 留白）。
  3. 以雙指在畫布左上象限固定中心點 `(cx, cy)` 原地放大約 2 倍。
  4. **觀察到的錯誤**：放大前後位於 `(cx, cy)` 螢幕座標下的場地座標從 `(311.6, 267.7)` 偏移至 `(333.4, 272.0)`（水平偏移達 `21.8` 場地單位，未以兩指捏合位置為中心）。
- **根因分析**：
  - `js/ui/editor.js:68-81` 改用 `board.getBoundingClientRect()` 的 `(clientX - rect.left) / rect.width` 換算場地錨點與相對位置 `rx`。當 `#board` 觸及 `max-height` 時，SVG 元素盒寬度 `rect.width`（`714px`）大於 SVG viewBox 實際渲染寬度（`567.9px`），線性比例換算未扣除左右留白，導致水平錨點失準。
  - 原先舊寫法之所以會跨幀亂跑，是因為舊寫法把 `drag.lastCenter` 存成上一幀換算出的「場地座標」，且 `panBy` 正負號相反；只要把 `drag.lastCenter` 維持存成**螢幕座標 `centerClient`**（如同目前 012 的做法），並在 `pinchMove()` 內**呼叫 `hooks.renderBoard()` 更新 DOM `viewBox` 之前**，用同一個當下 DOM 的 `board.getScreenCTM().inverse()`（即 `ptRaw`）同時換算 `drag.lastCenter` 與 `centerClient`，兩者就完全處於同一個座標系快照下，且 `getScreenCTM()` 會自動處理 SVG `preserveAspectRatio` 的留白偏移。
- **建議修法**：
  - 在 `js/ui/editor.js` 補回 `ptRaw(clientX, clientY)`，並在 `pinchMove()` 中於 `hooks.renderBoard()` 之前使用 `ptRaw` 換算 `anchor` 與 `cur`：
    ```js
    function ptRaw(clientX, clientY) {
      const p = board.createSVGPoint(); p.x = clientX; p.y = clientY;
      return p.matrixTransform(board.getScreenCTM().inverse());
    }

    function pinchMove() {
      const pts = [...pointers.values()];
      if (pts.length < 2) return;
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const centerClient = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const drag = state.drag;
      if (drag.lastDist) {
        const bd = bounds();
        const view = state.view || defaultView(bd);
        const anchor = ptRaw(drag.lastCenter.x, drag.lastCenter.y);
        const cur = ptRaw(centerClient.x, centerClient.y);
        const scale = dist / drag.lastDist;
        const w = view.w / scale;
        const h = w * bd.h / bd.w;
        const rx = (cur.x - view.x) / view.w;
        const ry = (cur.y - view.y) / view.h;
        state.view = clampView({ x: anchor.x - rx * w, y: anchor.y - ry * h, w, h }, bd);
        hooks.renderBoard();
      }
      drag.lastDist = dist; drag.lastCenter = centerClient;
    }
    ```
  - 實測此寫法在 `bb-half`（`1024×768`）雙指放大 2 倍時，`driftX` 由 `21.8` 降至 `0.012`（僅剩 `viewBox` 小數點第 1 位 `f()` 四捨五入差），且跨幀完全不會亂跑。

VERDICT: FAIL

