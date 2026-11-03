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
