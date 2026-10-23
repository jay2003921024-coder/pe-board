# 端到端驗收報告（第 5 輪）

- **驗收者**：`antigravity_ide`
- **啟動方式**：Headless Chrome（CDP `Input.dispatchTouchEvent` 真實瀏覽器觸控事件序列與 `MutationObserver` DOM 重繪監測）＋ Node 單元測試（137 項）
- **證據目錄**：`.bridge/evidence/verify-r5/`

## 驗收結果總表

| AC | 結果 | 證據 | 備註 |
|---|---|---|---|
| AC-1 | ✅ | evidence/verify-r5/AC-1.png | 14 種場地切換與 SVG 繪製皆正確，與舊版 golden test 100% 相同 |
| AC-2 | ✅ | evidence/verify-r5/AC-2.png | 全部工具（學生五色、老師、10 種器材、文字、跑動／傳球／運球線、區域）之建立、選取、拖曳、刪除與外觀皆與舊版一致，桌機滑鼠操作無退步 |
| AC-3 | ✅ | evidence/verify-r5/AC-3.png | 桌機快捷鍵 `V`/`S`/`T`/`C`/`B`/`X`/`R`/`P`/`D`/`Z`、`Ctrl+Z`、`Ctrl+Shift+Z`、`Esc`、`Delete` 行為與舊版相同 |
| AC-4 | ✅ | evidence/verify-r5/AC-4.png | 多步驟增刪切換、步驟名稱與說明編輯、動畫 `0.5×`／`1×`／`2×` 播放正常 |
| AC-5 | ✅ | evidence/verify-r5/AC-5.png | 「目前步驟」與「全部步驟＋說明」匯出 PNG 及「複製圖片」正常 |
| AC-6 | ✅ | evidence/verify-r5/AC-6.png | 同網域自動讀取舊版 `pe-board-v1` 與 `pe-board-mytpl-v1` 資料完整無誤 |
| AC-7 | ✅ | evidence/verify-r5/AC-7.png | 舊版範本檔匯入與新版匯出／再匯入往返相等 |
| AC-8 | ✅ | evidence/verify-r5/AC-8.png | 8 個內建範本套用內容與舊版逐字相同 |
| AC-9 | ✅ | evidence/verify-r5/AC-9.png | 深色模式（`prefers-color-scheme: dark`）配色與文字可讀性正常 |
| AC-10 | ✅ | evidence/verify-r5/AC-10.png | 純靜態 ES modules 零建置步驟、`.nojekyll` 與 `pe-board.html` 轉址正常 |
| AC-11 | ✅ | evidence/verify-r5/AC-11.png | `python3 -m http.server` 一行指令啟動正常，README 已載明 |
| AC-12 | ✅ | evidence/verify-r5/AC-12.png | 38 個模組檔全部 ≤ 400 行，`js/core/` 無 DOM／storage／Firebase 依賴 |
| AC-13 | ✅ | evidence/verify-r5/AC-13.png | `npm test` 137 項單元測試（含慣性滑行純函式 9 項測試）全數通過 |
| AC-14 | ❌ | evidence/verify-r5/AC-14.png | `handleR()` 的 `22` 是 SVG `viewBox` 單位而非 CSS px，在 iPad 橫向（1024×768）下線條端點與控制點外層透明命中圓實際只有 `24.99×24.99 CSS px`、iPad 直向（768×1024）下更只有 `20.15×20.15 CSS px`，未達 `44×44 px` 要求 |
| AC-15 | ❌ | evidence/verify-r5/AC-15.png | 單指在空白處捲動／平移時，每次 `pointerdown` 都無條件呼叫 `renderBoard()` 重寫 `board.innerHTML`（使 `e.target` 在手勢開始瞬間脫離 DOM），且放大後單指捲動（`panMove`）與慣性滑行（`inertiaApplyField`）每幀都重寫 `board.innerHTML`（單次滑動重繪整個 SVG DOM 達 59 次），違反任務 015「捲動期間不要重繪整個畫布」要求 |
| AC-16 | ✅ | evidence/verify-r5/AC-16.png | 頂端「復原」「重做」與觸控操作列「多選」「複製」「刪除」按鈕皆可純觸控完成 |
| AC-17 | ✅ | evidence/verify-r5/AC-17.png | `visualViewport` 螢幕鍵盤防遮擋邏輯正常 |
| AC-18 | ❌ | evidence/verify-r5/AC-18.png | ① 雙指原地捏合放大（中心點固定不動）放開後，因 `pinchMove` 以 `prevX - state.view.x`（viewBox 左上角因縮放改變的座標差）當作平移速度，放開瞬間觸發錯誤慣性滑行，使縮放中心大幅飄移 `328.02` 場地單位；② 手指拖曳後停住不放（如停頓 350ms）再放開，因未檢查最後一次移動距放開的時間差，仍會以舊速度觸發慣性滑行 |
| AC-19 | ✅ | evidence/verify-r5/AC-19.png | 未登入可瀏覽、搜尋、依場地篩選、預覽與套用共享區範本 |
| AC-20 | ✅ | evidence/verify-r5/AC-20.png | 未登入按發布提示登入，登入後保留編輯中教案並自動續接發布流程 |
| AC-21 | ✅ | evidence/verify-r5/AC-21.png | 最多 2 次點擊完成登入，頂端顯示使用者名稱與「登出」 |
| AC-22 | ✅ | evidence/verify-r5/AC-22.png | 發布後不重新整理頁面，未登入端重新開啟共享區即刻看到新範本、作者與時間 |
| AC-23 | ✅ | evidence/verify-r5/AC-23.png | 作者可修改刪除、非作者無按鈕且直接呼叫後端被規則拒絕 |
| AC-24 | ✅ | evidence/verify-r5/AC-24.png | 管理員顯示「下架」並可刪除，非管理員不顯示「下架」 |
| AC-25 | ✅ | evidence/verify-r5/AC-25.png | 未登入直接寫入後端一律被 `firestore.rules` 拒絕 |
| AC-26 | ✅ | evidence/verify-r5/AC-26.png | 共享區空狀態顯示說明文字、「看內建範本」與「發布第一個範本」按鈕 |
| AC-27 | ✅ | evidence/verify-r5/AC-27.png | 離線時畫圖、匯出、本機範本、檔案匯入匯出皆可用，共享區顯示離線提示 |
| AC-28 | ✅ | evidence/verify-r5/AC-28.png | 首次登入自動上傳本機範本並保留本機副本，資料夾聯集合併不互蓋 |
| AC-29 | ✅ | evidence/verify-r5/AC-29.png | 超過 50 個範本時支援「載入更多」分頁與依場地篩選 |

---

## 失敗項目詳細說明與建議修法

### 1. AC-14（及任務 015 第 2 項）：觸控時線條端點與控制點的「可點擊範圍」實際僅 20～25px，未達 44×44px

- **對應 AC**：AC-14（「Given iPad 橫向（1024×768）與直向（768×1024），When 開啟網站，Then 沒有水平捲軸，畫布與工具列同時可見，所有可點按鈕的觸控區至少 44×44 px」）及任務 015 第 2 項（「觸控時，線條端點與控制點的『可見圓圈』縮小到約目前的一半，但『可點擊範圍』維持至少 44×44px（AC-14）」）
- **檔案與行號**：
  - `js/ui/board.js:12-17`（`handleR`）
  - `js/ui/board.js:48-56`（`overlay` 內線條把手 `h()`）
- **重現方式與實測數據**：
  1. 在 iPad 橫向（`1024×768`）與直向（`768×1024`）觸控模式下，於畫布畫一條傳球線，量測 `#board [data-handle="p1"]`、`[data-handle="p2"]`、`[data-handle="c"]` 底下外層透明命中圓（`circle[0]`）與內層可見圓（`circle[1]`）的 `getBoundingClientRect()`（單位：CSS px）：
     - **iPad 橫向（1024×768）**：外層命中圓 `r="22"`（SVG 單位），螢幕實際尺寸為 **`24.99 × 24.99 CSS px`**（未達 `44×44 px`）；內層可見圓 `r="11"`，螢幕實際尺寸為 `12.49 × 12.49 CSS px`。
     - **iPad 直向（768×1024）**：外層命中圓 `r="22"`（SVG 單位），螢幕實際尺寸僅 **`20.15 × 20.15 CSS px`**（不到 `44px` 的一半）；內層可見圓 `r="11"`，螢幕實際尺寸為 `10.08 × 10.08 CSS px`（甚至比桌機模式的 `r = 13.1` SVG 單位＝`12.0 CSS px` 還小）。
- **根因分析**：
  - `handleR()` 中 `return state.ui.touch ? Math.max(r, 22) : r;` 的 `22` 是直接寫死在 `1000` 寬的 **SVG `viewBox` 座標系**，未乘上「CSS px → SVG viewBox 單位」的縮放換算比。在 iPad 上 `#board` 實際繪製寬度約為 `458～568 CSS px`（`1 SVG 單位 ≈ 0.46～0.57 CSS px`），因此半徑 `22` SVG 單位（直徑 `44` SVG 單位）換算到螢幕上只有 `20.15～24.99 CSS px`。
- **建議修法**：
  - 用 `board.getScreenCTM()`（或 `viewW / w`）把 **22 CSS px** 換算成 SVG 單位作為觸控時的點擊命中半徑 `hr`（確保外層透明圓在螢幕上的 `getBoundingClientRect()` 寬高恆 `≥ 44×44 CSS px`），而觸控時內層可見圓半徑 `vr` 取 `hr / 2`（約 `11 CSS px` 半徑，或 `r` 的約 1.8 倍、原本全尺寸的一半）：
    ```js
    export function handleR() {
      const viewW = (state.view || defaultView({ w: W, h: courtH(state.doc.court) })).w;
      const ctm = board.getScreenCTM?.();
      // pxToSvg：1 CSS px 對應多少 SVG viewBox 單位（優先用 getScreenCTM().a，已含 preserveAspectRatio 留白）
      const pxToSvg = (ctm && ctm.a) ? (1 / ctm.a) : (viewW / (board.getBoundingClientRect().width || viewW));
      const r = Math.max(8, 6 * pxToSvg);
      return state.ui.touch ? Math.max(r, 22 * pxToSvg) : r;
    }
    ```
  - 如此在任意 iPad 直／橫向與任意場地比例下，外層透明圓（`r = hr`）螢幕尺寸皆為 `44×44 CSS px`，內層可見圓（`vr = state.ui.touch ? hr / 2 : hr`）為 `22×22 CSS px`（剛好縮小一半、不擋箭頭，且不會比桌機的 `12×12 CSS px` 還小）。

---

### 2. AC-15（及任務 015 第 1 項）：捲動／平移期間重複呼叫 `renderBoard()` 重繪整個畫布（`board.innerHTML = ...`）

- **對應 AC**：AC-15 及任務 015 第 1 項（「要求：捲動過程畫面穩定，不重新載入、不閃爍；**捲動期間不要重繪整個畫布**。請找出原因並在交接筆記說明」）
- **檔案與行號**：
  - `js/ui/editor.js:66-71`（`inertiaApplyField` 內每幀呼叫 `hooks.renderBoard()`）
  - `js/ui/editor.js:166-167`（`pinchMove` 內每幀呼叫 `hooks.renderBoard()`）
  - `js/ui/editor.js:229-236`（`onPointerDown` 空白處開始 `pan` 時無條件呼叫 `hooks.renderBoard()`）
  - `js/ui/editor.js:250-256`（`panMove` 放大狀態下每幀呼叫 `hooks.renderBoard()`）
  - `js/ui/board.js:60-67`（`renderBoard` 每次執行 `board.innerHTML = boardContent(...) + overlay()`）
- **重現方式與實測數據**：
  1. 在 `#board` 掛載 `MutationObserver({ childList: true })` 監測整個 SVG DOM 子樹被銷毀重繪的次數：
     - **未放大時單指在空白處滑動**：即使場上原本沒有選取任何物件（`selIds().length === 0`）且 `state.ui.touch` 已經是 `true`，每次手指按下空白處開始捲動（`onPointerDown` 第 235 行）都會無條件呼叫 `hooks.renderBoard()`，觸發 `board.innerHTML = ...` 重建整個 SVG DOM（`rebuildsOnTouchStart = 1`），並使手指剛按下的目標節點 `e.target` 在手勢啟動瞬間脫離 DOM 樹。在 iPad Safari 連續多次撥動捲動頁面時，每次觸碰都會銷毀並重新解析整張 SVG（含 `<defs>`、`<filter>`、場地線與所有物件）造成畫面閃爍。
     - **放大後單指在空白處上下捲動＋慣性滑行**：單指滑動 8 步放開後接續慣性滑行，`panMove`（第 255 行）與 `inertiaApplyField`（第 70 行）在每一幀都呼叫 `hooks.renderBoard()`，短短 0.8 秒內**重寫 `board.innerHTML` 銷毀重建整個畫布達 59 次**（`rebuildsZoomedPan = 59`）。
     - **雙指縮放平移**：8 步雙指捏合期間 `pinchMove`（第 167 行）**重寫 `board.innerHTML` 達 17 次**（`rebuildsDuringPinch = 17`）。
- **根因分析**：
  - `renderBoard()` 把「更新 `<svg viewBox>` 屬性」與「重建 `board.innerHTML` 全部 SVG 節點」綁在同一個函式裡。
  - 在單指平移（`panMove`）、慣性滑行（`inertiaApplyField`）或無選取物件時的雙指縮放（`pinchMove`）期間，場地與物件的 SVG 內容（`boardContent`）完全沒有改變，只有 `state.view`（即 `<svg viewBox>`）改變；且在 `onPointerDown` 進入 `kind: 'pan'` 時，若原本沒有選取任何物件（`!hadSel`）且 `touch` 模式未改變，連 `board.innerHTML` 與 `renderProps()` 都不需要跑。
- **建議修法**：
  1. 在 `js/ui/board.js` 新增只更新 `viewBox`（不重寫 `board.innerHTML`）的輕量函式並掛入 `hooks.renderView`：
     ```js
     export function renderView() {
       const bounds = { w: W, h: courtH(state.doc.court) };
       const view = state.view || defaultView(bounds);
       board.setAttribute('viewBox', `${f(view.x)} ${f(view.y)} ${f(view.w)} ${f(view.h)}`);
     }
     ```
     （在 `js/ui/state.js` 的 `hooks` 補上 `renderView: noop`，並在 `initBoard()` 設定 `hooks.renderView = renderView`。）
  2. 在 `js/ui/editor.js`：
     - `onPointerDown`（第 178、228-236 行）：記錄按下前 `const prevTouch = state.ui.touch;` 與 `const hadSel = selIds().length > 0;`；在 `if (state.ui.touch && !multi)` 分支中，只有當 `hadSel || !prevTouch` 時才呼叫 `hooks.renderBoard(); hooks.renderProps();`，否則完全不重繪畫布。
     - `panMove`（第 255 行）與 `inertiaApplyField`（第 70 行）：將 `hooks.renderBoard()` 改為 `hooks.renderView()`，捲動與慣性滑行期間**零次**重寫 `board.innerHTML`。
     - `pinchMove`（第 167 行）：若目前沒有選取物件（`!selIds().length`），同樣只呼叫 `hooks.renderView()`，不重寫 `board.innerHTML`。

---

### 3. AC-18（及任務 015 第 3 項）：雙指原地捏合縮放放開後會觸發錯誤慣性滑行導致縮放中心大幅飄移；且手指停住再放開仍會滑行

- **對應 AC**：AC-18 及任務 015 第 3 項（「單指平移或雙指平移放開後，依放開時的速度繼續滑行並逐漸減速停止，手感接近 iOS 原生捲動；手指再次按下時立即停止滑行。**縮放中心維持以捏合中點為準。**」）
- **檔案與行號**：
  - `js/ui/editor.js:30-41`（`trackVelocity`）
  - `js/ui/editor.js:73-77`（`startInertiaFromDrag`）
  - `js/ui/editor.js:147-173`（`pinchMove`）
- **重現方式與實測數據**：
  1. **問題 A（雙指原地縮放放開後，縮放中心被慣性滑行甩偏 328 場地單位）**：
     - 在 iPad 橫向（`1024×768`）下，將雙指中心固定在螢幕座標 `(cx, cy)`（對應場地座標 `(375.0, 236.0)`），雙指對稱往外張開放大約 2 倍（中點完全不移動），隨後放開雙指。
     - 放開瞬間 `(cx, cy)` 下的場地座標為 `(379.4, 239.5)`（`viewBox="180.2 112.3 531.2 503.3"`）；但**放開雙指後畫布卻自行往右下角高速慣性滑行**，0.8 秒後停在 `viewBox="468.8 256.2 531.2 503.3"`，使捏合中心點對應的場地座標飄移到 `(668.0, 383.4)`，**偏移量高達 `328.02` 場地單位**！
  2. **問題 B（手指拖曳後停住不放，停頓 350ms 再放開，仍會觸發慣性滑行）**：
     - 單指在空白處向上滑動 5 步（`scrollY` 到 `64`），**手指停在原處不移動 350ms** 後才放開手指（`touchEnd`）。
     - 放開後頁面仍繼續滑行到 `scrollY = 178`（多滑了 `114px`）。正常 iOS 原生捲動中，若使用者手指已經停住再放開（非甩動 flick），放開時速度為 0，不應繼續滑行。
- **根因分析**：
  - **問題 A 根因**：`pinchMove()` 第 169 行寫了 `trackVelocity(drag, prevX - state.view.x, prevY - state.view.y)`。但 `state.view.x`／`state.view.y` 是 `viewBox` 的**左上角座標**！當雙指在 `(375, 236)` 原地放大（`scale > 1`、兩指中點位移為 `0`）時，因為 `view.w` 從 `1000` 縮小到 `531.2`，為了維持 `(375, 236)` 在畫面原處不動，`view.x` 必須從 `0` 變為 `180.2`。`prevX - state.view.x` 把這個「因縮放造成的左上角座標改變」誤當成「雙指平移速度」，導致放開雙指後啟動了巨幅慣性平移，破壞了捏合縮放中心。雙指平移的真實位移量應該是**兩指中心點 `centerClient` 相對 `drag.lastCenter` 的螢幕位移換算成場地單位**（即 `(centerClient.x - drag.lastCenter.x) * m.a` 與 `(centerClient.y - drag.lastCenter.y) * m.d`），當兩指中心點不動時平移速度才會是 `0`。
  - 此外，雙指觸控每一幀會先後觸發兩次 `pointermove`（第一指、第二指各一次，間隔常 `< 1ms`），若 `dt < 4ms` 時直接除以極小的 `dt`，會讓瞬時速度因同幀雙事件而被放大數十倍。
  - **問題 B 根因**：`startInertiaFromDrag(drag)` 沒有檢查最後一次移動事件的時間戳 `drag.t` 距離放開當下 `performance.now()` 是否已經過久（例如超過 `80ms` 代表手指在放開前已經停住）。
- **建議修法**：
  1. 在 `pinchMove()` 中，只取「兩指中心點 `centerClient` 的移動量」換算為場地單位傳給 `trackVelocity`：
     ```js
     const m = board.getScreenCTM().inverse();
     const dxCenter = (centerClient.x - drag.lastCenter.x) * m.a + (centerClient.y - drag.lastCenter.y) * m.c;
     const dyCenter = (centerClient.x - drag.lastCenter.x) * m.b + (centerClient.y - drag.lastCenter.y) * m.d;
     state.view = clampView({ x: anchor.x - rx * w, y: anchor.y - ry * h, w, h }, bd);
     if (selIds().length) hooks.renderBoard(); else hooks.renderView();
     trackVelocity(drag, dxCenter, dyCenter);
     drag.space = 'field';
     ```
  2. 在 `trackVelocity(drag, dx, dy)` 中，累加同幀過短時間間隔（例如 `dt < 8` 毫秒時先把 `dx, dy` 累加到暫存，滿 `8ms` 再計算 `ivx = accDx / dt`），避免雙指同幀兩次 `pointermove` 因 `dt ≈ 0.1ms` 造成速度暴衝：
     ```js
     function trackVelocity(drag, dx, dy) {
       const now = performance.now();
       drag.accDx = (drag.accDx || 0) + dx;
       drag.accDy = (drag.accDy || 0) + dy;
       if (drag.t === undefined) { drag.t = now; return; }
       const dt = now - drag.t;
       if (dt < 8) return;
       const ivx = drag.accDx / dt, ivy = drag.accDy / dt;
       drag.vx = drag.vx === undefined ? ivx : (drag.vx + ivx) / 2;
       drag.vy = drag.vy === undefined ? ivy : (drag.vy + ivy) / 2;
       drag.accDx = 0; drag.accDy = 0;
       drag.t = now;
       drag.lastMoveAt = now;
     }
     ```
  3. 在 `startInertiaFromDrag(drag)` 中，若最後一次有效移動距離放開超過 `80ms`（代表手指已停住再放開），則不啟動慣性滑行：
     ```js
     function startInertiaFromDrag(drag) {
       if (!drag || drag.vx === undefined || !drag.lastMoveAt) return;
       if (performance.now() - drag.lastMoveAt > 80) return;
       const vx = clampVelocity(drag.vx), vy = clampVelocity(drag.vy);
       startInertia(vx, vy, drag.space === 'client' ? inertiaApplyScroll : inertiaApplyField);
     }
     ```

VERDICT: FAIL

