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
