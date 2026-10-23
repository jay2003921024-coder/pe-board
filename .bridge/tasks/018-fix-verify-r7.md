---
id: 018
title: 修正第 7 輪驗收失敗（慣性撞底不停、捲動起手速度放大）
owner: claude
status: done
depends_on: []
reviewer: claude
attempts: 0
---

## 目標

修正 `.bridge/reviews/verify-r7.md` 的 AC-15、AC-18 問題。驗收連續失敗 3 輪、bridge 停止後，由使用者指示 claude 直接在對話中修正（未經 bridge 的實作／審查流程）。

## 涵蓋的驗收條件

- AC-15、AC-18

## 交接筆記

**做了什麼**
- `js/core/viewport.js` 新增純函式：`inertiaStepper`（逐幀推進，apply 回傳 false 即停止、不再排下一幀）、`clampScroll`（只有「有移動需求的軸全都被夾住」才算撞牆）、`edgeVelocity`（放手時貼邊界判斷，容許 1px 次像素誤差 `EDGE_EPS`）。
- `js/ui/editor.js`：`startInertia` 改用 `inertiaStepper`，修正 verify-r7 指出的「`stopInertia()` 被下一行 `requestAnimationFrame` 覆蓋」；`inertiaApplyScroll` 改用 `clampScroll` 並以回傳值停止；`startInertiaFromDrag` 改用 `edgeVelocity`。
- `panMove` 跨越 8px 門檻那一幀：畫面照樣補上累積的位移（內容保持在手指下方），但算速度時只按比例取這一幀本身的位移，避免初速被放大。**未採納** verify-r7 建議的「扣掉 8px」，因為那會讓內容永遠落後手指 8px。

**怎麼驗證**
- `npm test`：143 項全數通過（新增 6 項：撞底停止、垂直滑動帶水平分量不提早停、次像素邊界、初速太小不滑行等）。
- 變異測試：把 `inertiaStepper` 改回「忽略停止訊號」，「apply 回傳 false 後立刻停止」測試失敗，改回後通過。
- headless Chrome 載入首頁，畫布正常渲染，沒有模組載入錯誤。

**已知限制**
- 滑動手感仍需要使用者在實體 iPad 上確認。
