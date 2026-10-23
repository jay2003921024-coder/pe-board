// 畫布縮放／平移：純函式，view 以 viewBox 表示 {x,y,w,h}；bounds 是未縮放的場地尺寸 {w,h}。
// 縮放倍率限制在 1～4（w 介於 bounds.w/4～bounds.w），h 永遠依 bounds 的比例跟著 w 算，平移只需各自夾在 [0, bounds.w-w]／[0, bounds.h-h]。

export function defaultView(bounds) {
  return { x: 0, y: 0, w: bounds.w, h: bounds.h };
}

export function clampView(view, bounds) {
  const minW = bounds.w / 4;
  const w = Math.max(minW, Math.min(bounds.w, view.w));
  const h = w * bounds.h / bounds.w;
  const x = Math.max(0, Math.min(bounds.w - w, view.x));
  const y = Math.max(0, Math.min(bounds.h - h, view.y));
  return { x, y, w, h };
}

// centerPt（場地座標）在縮放前後維持在畫面上同一個相對位置；scale 是這次手勢的縮放倍率（>1 放大、<1 縮小）。
export function zoomAt(view, centerPt, scale, bounds) {
  const w = view.w / scale;
  const h = w * bounds.h / bounds.w;
  const rx = (centerPt.x - view.x) / view.w;
  const ry = (centerPt.y - view.y) / view.h;
  return clampView({ x: centerPt.x - rx * w, y: centerPt.y - ry * h, w, h }, bounds);
}

export function panBy(view, dx, dy, bounds) {
  return clampView({ x: view.x + dx, y: view.y + dy, w: view.w, h: view.h }, bounds);
}

export function zoomLevel(view, bounds) {
  return bounds.w / view.w;
}

// 慣性滑行（放開手指後，依放開時的速度繼續滑行並逐漸減速停止）的參數，集中在這裡方便使用者自行調整：
// - decayPerMs：速度每經過 1 毫秒衰減為原本的這個比例（0～1，越小停得越快）；0.998 接近 iOS 原生捲動手感。
// - minVelocity：速度低於這個門檻（場地單位或 CSS px，依呼叫端的座標系）就視為已停止，不再繼續滑行。
// - maxVelocity：放開手指瞬間的最大滑行速度上限，避免手勢結尾取樣誤差（例如最後一次移動特別大）讓滑行距離暴衝。
export const INERTIA = {
  decayPerMs: 0.998,
  minVelocity: 0.02,
  maxVelocity: 3,
};

export function clampVelocity(v, max = INERTIA.maxVelocity) {
  return Math.max(-max, Math.min(max, v));
}

// 純函式：初速 v0 經過 tMs 毫秒後的瞬時速度（指數衰減 v(t) = v0 · decayPerMs^t）。
export function velocityAt(v0, tMs, decayPerMs = INERTIA.decayPerMs) {
  return v0 * Math.pow(decayPerMs, tMs);
}

// 純函式：初速 v0 經過 tMs 毫秒後累積滑行的位移（velocityAt 對時間積分的封閉解）。
export function distanceAt(v0, tMs, decayPerMs = INERTIA.decayPerMs) {
  if (v0 === 0) return 0;
  return v0 * (Math.pow(decayPerMs, tMs) - 1) / Math.log(decayPerMs);
}

// 純函式：初速 v0 衰減到 minVelocity 以下（視為停止）所需的時間（毫秒）。
export function inertiaStopTime(v0, decayPerMs = INERTIA.decayPerMs, minVelocity = INERTIA.minVelocity) {
  const abs0 = Math.abs(v0);
  if (abs0 <= minVelocity) return 0;
  return Math.log(minVelocity / abs0) / Math.log(decayPerMs);
}

// 純函式：初速 v0 直到停止為止，總共會滑行的距離。
export function totalInertiaDistance(v0, decayPerMs = INERTIA.decayPerMs, minVelocity = INERTIA.minVelocity) {
  return distanceAt(v0, inertiaStopTime(v0, decayPerMs, minVelocity), decayPerMs);
}

// 慣性滑行的逐幀推進器（不碰 requestAnimationFrame，呼叫端自己排程）。
// 回傳 step(elapsedMs)：算出這一幀的位移交給 apply(dx, dy)；apply 回傳 false 代表撞到邊界要停。
// step 回傳 true 才需要排下一幀（verify-r7：原本停止旗標會被「無條件排下一幀」覆蓋，撞底後持續空轉）。
// 初速太小、不需要滑行時回傳 null。
export function inertiaStepper(vx, vy, apply) {
  const v0 = Math.hypot(vx, vy);
  const stopAt = v0 ? inertiaStopTime(v0) : 0;
  if (!stopAt) return null;
  const ux = vx / v0, uy = vy / v0;
  let prevDist = 0;
  return elapsedMs => {
    const t = Math.min(elapsedMs, stopAt);
    const dist = distanceAt(v0, t);
    const delta = dist - prevDist;
    prevDist = dist;
    if (delta && apply(ux * delta, uy * delta) === false) return false;
    return t < stopAt;
  };
}

// iPad 等高解析度螢幕上，捲到底時 scrollY 可能是 max - 0.5，邊界判斷要容許次像素誤差。
export const EDGE_EPS = 1;

// 純函式：把一幀的捲動位移（手指位移，頁面往反方向捲）夾在 [0, max] 內。
// stop：有移動需求的軸全都被夾住才算撞到邊界；垂直滑動帶一點水平分量、但頁面沒有水平捲軸時，
// 只有水平軸被夾住，不能因此中斷垂直慣性。
export function clampScroll(pos, delta, max) {
  const wantX = pos.x - delta.x, wantY = pos.y - delta.y;
  const x = Math.max(0, Math.min(max.x, wantX));
  const y = Math.max(0, Math.min(max.y, wantY));
  const stuckX = !delta.x || x !== wantX;
  const stuckY = !delta.y || y !== wantY;
  return { x, y, stop: stuckX && stuckY };
}

// 純函式：放開手指時，這一軸已經貼在邊界、速度又往邊界外衝，就不需要慣性（回傳 0）。
// v < 0 代表手指往上／左甩、頁面往 max 方向捲。
export function edgeVelocity(v, pos, max, eps = EDGE_EPS) {
  if (v < 0 && pos >= max - eps) return 0;
  if (v > 0 && pos <= eps) return 0;
  return v;
}
