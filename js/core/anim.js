// 步驟動畫的純邏輯：物件配對、沿箭頭路徑、每一格的位置（搬自舊版 Step animation 段落，參數化）。
import { isLine } from './items.js';
import { qpt } from './render.js';

export const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const sameZone = (a, b) => a.id === b.id && ['x1', 'y1', 'x2', 'y2'].every(k => Math.abs(a[k] - b[k]) < 0.5);

// Pair each object in the next step with the same object in the previous one:
// by id, then (for people) by team + number, then nearest object of the same kind.
export function matchItems(A, B) {
  const pa = A.filter(o => !isLine(o)), pb = B.filter(o => !isLine(o));
  const used = new Set(), map = new Map();
  for (const b of pb) { const a = pa.find(a => !used.has(a) && a.id === b.id && a.type === b.type); if (a) { used.add(a); map.set(b, a); } }
  for (const b of pb) {
    if (map.has(b) || (b.type !== 'player' && b.type !== 'teacher')) continue;
    const a = pa.find(a => !used.has(a) && a.type === b.type && (a.team || '') === (b.team || '') && String(a.label ?? '') === String(b.label ?? ''));
    if (a) { used.add(a); map.set(b, a); }
  }
  const pairs = [];
  for (const b of pb) {
    if (map.has(b)) continue;
    for (const a of pa) if (!used.has(a) && a.type === b.type && (a.type !== 'text' || a.label === b.label)) pairs.push([Math.hypot(a.x - b.x, a.y - b.y), a, b]);
  }
  pairs.sort((p, q) => p[0] - q[0]);
  for (const [, a, b] of pairs) if (!used.has(a) && !map.has(b)) { used.add(a); map.set(b, a); }
  return { map, gone: pa.filter(a => !used.has(a)), appear: pb.filter(b => !map.has(b)) };
}

// If an arrow in the previous step starts at this object and ends where it lands, travel along that arrow.
export function findPath(a, b, lines) {
  const ball = a.type === 'ball', thrS = ball ? 80 : 45, thrE = ball ? 80 : 60;
  let best = null, bs = Infinity;
  for (const l of lines) {
    if (l.type === 'zone' || (!ball && l.type === 'pass')) continue;
    const ds = Math.hypot(l.x1 - a.x, l.y1 - a.y), de = Math.hypot(l.x2 - b.x, l.y2 - b.y);
    if (ds < thrS && de < thrE && ds + de < bs) { best = l; bs = ds + de; }
  }
  return best;
}

export function planTransition(doc, i) {
  const A = doc.steps[i].items, B = doc.steps[i + 1].items, lines = A.filter(isLine);
  const { map, gone, appear } = matchItems(A, B);
  const moves = [...map].map(([b, a]) => ({ a, b, path: findPath(a, b, lines) }));
  const zA = A.filter(o => o.type === 'zone'), zB = B.filter(o => o.type === 'zone');
  return {
    moves, gone, appear,
    zonesKeep: zB.filter(b => zA.some(a => sameZone(a, b))),
    zonesOut: zA.filter(a => !zB.some(b => sameZone(a, b))),
    zonesIn: zB.filter(b => !zA.some(a => sameZone(a, b))),
    linesOut: lines.filter(l => l.type !== 'zone'),
  };
}

export function posAt(m, e) {
  const { a, b, path: l } = m;
  let x, y;
  if (l) { const [px, py] = qpt(e, l); x = px + (a.x - l.x1) * (1 - e) + (b.x - l.x2) * e; y = py + (a.y - l.y1) * (1 - e) + (b.y - l.y2) * e; }
  else { x = a.x + (b.x - a.x) * e; y = a.y + (b.y - a.y) * e; }
  let ra = a.rot || 0, rb = b.rot || 0, d = ((rb - ra + 540) % 360) - 180;
  return { ...b, x, y, rot: ra + d * e };
}
