// 畫布 pointer 互動：放置、選取、拖曳、框選、線條端點與控制點把手（搬自舊版 Pointer interaction 段 845～949）。
import { W, uid } from '../core/util.js';
import { courtH, COURTS } from '../core/courts.js';
import { ITEMS, LINES, isLine, clampSize } from '../core/items.js';
import { qpt } from '../core/render.js';
import { shiftObj, nextLabel } from '../core/doc.js';
import { $, state, hooks, step, getSel, selIds, selObjs, setSelection, selectOne, clearSel, pushUndo, history, save, updateHistory } from './state.js';

let board;

function pt(e) {
  const p = board.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  const q = p.matrixTransform(board.getScreenCTM().inverse());
  return { x: Math.max(0, Math.min(W, q.x)), y: Math.max(0, Math.min(courtH(state.doc.court), q.y)) };
}

function boxHits(a, b) {
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  const inside = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  return step().items.filter(o => {
    if (o.type === 'zone') return inside(o.x1, o.y1) && inside(o.x2, o.y2);
    if (isLine(o)) { const [mx, my] = qpt(0.5, o); return inside(mx, my); }
    return inside(o.x, o.y);
  }).map(o => o.id);
}

function onPointerDown(e) {
  if (e.button !== 0) return;
  if (state.anim) { hooks.stopAnim(); return; }
  const p = pt(e);
  const hEl = e.target.closest('[data-handle]'), gEl = e.target.closest('[data-id]');
  try { board.setPointerCapture(e.pointerId); } catch (err) {}
  const ui = state.ui;
  if (hEl && getSel()) {
    const o = getSel();
    state.drag = { kind: 'handle', which: hEl.dataset.handle, moved: false };
    if (state.drag.which === 'ts') { state.drag.s0 = o.size || 18; state.drag.d0 = Math.max(4, Math.hypot(p.x - o.x, p.y - o.y)); }
    return;
  }
  const t = ui.tool;
  if (LINES[t]) {
    pushUndo();
    const l = { id: uid(), type: t, x1: p.x, y1: p.y, x2: p.x, y2: p.y, cx: p.x, cy: p.y, auto: true, color: ui.ink };
    if (t === 'zone') l.label = '';
    step().items.push(l); selectOne(l.id);
    state.drag = { kind: 'new', moved: true };
    hooks.renderBoard(); return;
  }
  if (gEl) {
    const id = gEl.dataset.id;
    if (e.shiftKey) { const ids = selIds(); setSelection(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); state.drag = null; hooks.renderBoard(); hooks.renderProps(); return; }
    if (!selIds().includes(id)) selectOne(id);
    state.drag = { kind: 'move', last: p, moved: false };
    hooks.renderBoard(); hooks.renderProps(); return;
  }
  if (ITEMS[t]) {
    pushUndo();
    const it = { id: uid(), type: t, x: p.x, y: p.y };
    if (t === 'player') { it.team = ui.team; it.label = nextLabel(step().items, ui.team); }
    if (t === 'ball') it.color = COURTS[state.doc.court].ball;
    if (t === 'text') { it.label = '文字'; it.size = 18; it.color = ui.ink; }
    if (t === 'mat') { it.label = '軟墊'; }
    if (ITEMS[t].rot) it.rot = 0;
    step().items.push(it); selectOne(it.id);
    state.drag = { kind: 'move', last: p, moved: true };
    hooks.renderBoard(); hooks.renderProps(); save(); return;
  }
  // 空白處用選取工具：開始框選（Shift 保留目前的選取）。
  const base = e.shiftKey ? selIds() : [];
  if (!e.shiftKey) clearSel();
  state.drag = { kind: 'box', start: p, cur: p, base };
  hooks.renderBoard(); hooks.renderProps();
}

function onPointerMove(e) {
  const drag = state.drag;
  if (!drag) return;
  const p = pt(e);
  if (drag.kind === 'box') { drag.cur = p; setSelection([...drag.base, ...boxHits(drag.start, p)]); hooks.renderBoard(); return; }
  if (drag.kind === 'move') {
    const objs = selObjs(); if (!objs.length) return;
    const dx = p.x - drag.last.x, dy = p.y - drag.last.y; drag.last = p;
    if (!dx && !dy) return;
    if (!drag.moved) { pushUndo(); drag.moved = true; }
    objs.forEach(o => shiftObj(o, dx, dy)); hooks.renderBoard(); return;
  }
  const o = getSel(); if (!o) return;
  if (!drag.moved) { pushUndo(); drag.moved = true; }
  if (drag.kind === 'new') {
    o.x2 = p.x; o.y2 = p.y; o.cx = (o.x1 + o.x2) / 2; o.cy = (o.y1 + o.y2) / 2;
  } else if (drag.kind === 'handle') {
    // 黃色把手放在曲線中點；反推要讓把手落在那裡所需的貝茲控制點。
    if (drag.which === 'ts') { o.size = clampSize(drag.s0 * Math.hypot(p.x - o.x, p.y - o.y) / drag.d0); }
    else if (drag.which === 'c') { o.cx = 2 * p.x - (o.x1 + o.x2) / 2; o.cy = 2 * p.y - (o.y1 + o.y2) / 2; o.auto = false; }
    else {
      const k = drag.which === 'p1' ? 1 : 2; o['x' + k] = p.x; o['y' + k] = p.y;
      if (o.auto) { o.cx = (o.x1 + o.x2) / 2; o.cy = (o.y1 + o.y2) / 2; }
    }
  }
  hooks.renderBoard();
}

function endDrag() {
  const drag = state.drag;
  if (!drag) return;
  const o = getSel();
  if (drag.kind === 'new' && o && Math.hypot(o.x2 - o.x1, o.y2 - o.y1) < 10) {
    step().items = step().items.filter(x => x !== o); clearSel(); history.popLast(); updateHistory();
  }
  const wasSize = drag.which === 'ts';
  state.drag = null; hooks.renderBoard();
  if (wasSize) { const o2 = getSel(), v = o2 && (o2.size || 18); if ($('#propSize')) { $('#propSize').value = v; $('#propSizeNum').value = v; } } else hooks.renderProps();
  save();
}

export function initEditor() {
  board = $('#board');
  board.addEventListener('pointerdown', onPointerDown);
  board.addEventListener('pointermove', onPointerMove);
  board.addEventListener('pointerup', endDrag);
  board.addEventListener('pointercancel', endDrag);
  board.addEventListener('dblclick', () => { const i = $('#propLabel'); if (i) { i.focus(); i.select(); } });
}
