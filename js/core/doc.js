// 教案資料：正規化、讀回已存的教案、存成範本、物件位移、學生自動編號（搬自舊版，參數化）。
import { uid } from './util.js';
import { COURTS } from './courts.js';
import { ITEMS, LINES, isLine } from './items.js';

export function normalizeDoc(d) {
  d = JSON.parse(JSON.stringify(d || {}));
  if (!COURTS[d.court]) d.court = 'gym';
  if (!Array.isArray(d.steps) || !d.steps.length) d.steps = [{ id: uid(), name: '', note: '', items: [] }];
  d.steps = d.steps.map(s => ({ id: s.id || uid(), name: s.name || '', note: s.note || '', items: Array.isArray(s.items) ? s.items.filter(o => o && (ITEMS[o.type] || LINES[o.type])) : [] }));
  d.cur = 0; d.iconScale = +d.iconScale || 1;
  for (const k of ['title', 'grade', 'players', 'equipment', 'duration']) d[k] = typeof d[k] === 'string' ? d[k] : '';
  if (!d.grade) d.grade = '國中';
  delete d.srcTpl;
  return d;
}

export const tplFromDoc = (d, extra) => { const n = normalizeDoc(d); return { name: n.title || '未命名教案', court: n.court, grade: n.grade, steps: n.steps.length, doc: n, folder: '', ...extra }; };

// 讀回 localStorage `pe-board-v1` 的字串：JSON 合法、steps 非空、場地存在才採用，否則回 null（舊版不正規化）。
export function parseSavedDoc(raw) {
  try { if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.steps) && d.steps.length && COURTS[d.court]) return d; } } catch (e) {}
  return null;
}

export function shiftObj(o, dx, dy) {
  if (isLine(o)) { o.x1 += dx; o.y1 += dy; o.x2 += dx; o.y2 += dy; o.cx += dx; o.cy += dy; }
  else { o.x += dx; o.y += dy; }
}

export function nextLabel(items, team) {
  const nums = items.filter(o => o.type === 'player' && o.team === team).map(o => parseInt(o.label, 10)).filter(n => !isNaN(n));
  return String(nums.length ? Math.max(...nums) + 1 : 1);
}
