// 手勢判定純函式（不碰 DOM，只依狀態與手勢特徵決定手勢歸屬）。
// AC-15、AC-18：手勢在按下那一刻決定交給誰，之後不再轉手。

export function touchOwner({ tool, multi, zoomed, onTarget, touchCount = 1, animating = false } = {}) {
  if (touchCount >= 2) return 'app';
  if (animating) return 'app';
  if (onTarget) return 'app';
  if (tool !== 'select') return 'app';
  if (multi) return 'app';
  if (zoomed) return 'app';
  return 'native';
}

export function blankIsNative({ tool, multi, zoomed, animating = false } = {}) {
  if (animating) return false;
  if (tool !== 'select') return false;
  if (multi) return false;
  if (zoomed) return false;
  return true;
}
