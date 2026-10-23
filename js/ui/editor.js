// 畫布 pointer 互動：放置、選取、拖曳、框選、線條端點與控制點把手（搬自舊版 Pointer interaction 段 845～949）。
// 005 加入：多選模式（取代 Shift）、雙指縮放平移、觸控狀態偵測。
import { W, uid } from '../core/util.js';
import { courtH, COURTS } from '../core/courts.js';
import { ITEMS, LINES, isLine, clampSize } from '../core/items.js';
import { qpt } from '../core/render.js';
import { clampView, defaultView, zoomLevel, panBy, clampVelocity, distanceAt, inertiaStopTime } from '../core/viewport.js';
import { shiftObj, nextLabel } from '../core/doc.js';
import { $, state, hooks, step, getSel, findObj, selIds, selObjs, setSelection, selectOne, clearSel, pushUndo, history, save, updateHistory } from './state.js';

let board;
// 平板雙指縮放／平移：pointerId → 最近一次的 client 座標。
const pointers = new Map();
// pointerId → 這一指最初命中的節點：onPointerDown 之後 renderBoard() 會用 innerHTML 整個換掉
// #board 底下的節點，命中節點脫離 DOM 後，瀏覽器仍會把同一指後續的 touchmove 派發給它
// （W3C Touch Events：事件固定送往 touchstart 時的 Touch.target），不會冒泡到 #board，
// 所以要在那個節點上也掛一份 onTouchMove，否則 preventDefault() 永遠叫不到，觸發 pointercancel（AC-15）。
const touchTargets = new Map();

// 15 加強：慣性滑行。減速參數集中在 core/viewport.js 的 INERTIA；這裡只負責「取樣手勢速度」與
// 「用 requestAnimationFrame 依純函式算出的位移逐幀套用」，不重算衰減公式本身。
let inertiaFrame = null;

function stopInertia() {
  if (inertiaFrame !== null) { cancelAnimationFrame(inertiaFrame); inertiaFrame = null; }
}

// drag.vx/vy：跟前一次取樣用等權重平均，避免手勢結尾最後一次取樣的雜訊讓滑行速度暴衝；
// dx/dy 跟呼叫端用來平移的位移同一套單位與方向（panMove 傳 client px 或場地單位，pinchMove 傳場地單位）。
function trackVelocity(drag, dx, dy) {
  const now = performance.now();
  if (drag.t !== undefined) {
    const dt = now - drag.t;
    if (dt > 0) {
      const ivx = dx / dt, ivy = dy / dt;
      drag.vx = drag.vx === undefined ? ivx : (drag.vx + ivx) / 2;
      drag.vy = drag.vy === undefined ? ivy : (drag.vy + ivy) / 2;
    }
  }
  drag.t = now;
}

// apply(dx, dy)：跟 panMove 呼叫 panBy/scrollBy 時同一套「位移」語意（由呼叫端自行取負號套用）。
function startInertia(vx, vy, apply) {
  stopInertia();
  const v0 = Math.hypot(vx, vy);
  if (!v0) return;
  const ux = vx / v0, uy = vy / v0;
  const stopAt = inertiaStopTime(v0);
  if (!stopAt) return;
  const start = performance.now();
  let prevDist = 0;
  function step(now) {
    const t = Math.min(now - start, stopAt);
    const dist = distanceAt(v0, t);
    const delta = dist - prevDist;
    prevDist = dist;
    if (delta) apply(ux * delta, uy * delta);
    if (t >= stopAt) { inertiaFrame = null; return; }
    inertiaFrame = requestAnimationFrame(step);
  }
  inertiaFrame = requestAnimationFrame(step);
}

function inertiaApplyScroll(dx, dy) { window.scrollBy(-dx, -dy); }
function inertiaApplyField(dx, dy) {
  const bd = bounds();
  const view = state.view || defaultView(bd);
  state.view = panBy(view, -dx, -dy, bd);
  hooks.renderBoard();
}

function startInertiaFromDrag(drag) {
  if (!drag || drag.vx === undefined) return;
  const vx = clampVelocity(drag.vx), vy = clampVelocity(drag.vy);
  startInertia(vx, vy, drag.space === 'client' ? inertiaApplyScroll : inertiaApplyField);
}

function bindTouchTarget(e) {
  if (e.pointerType !== 'touch' || !e.target || e.target === board) return;
  e.target.addEventListener('touchmove', onTouchMove, { passive: false });
  touchTargets.set(e.pointerId, e.target);
}

function unbindTouchTarget(e) {
  if (!e) return;
  const t = touchTargets.get(e.pointerId);
  if (t) { t.removeEventListener('touchmove', onTouchMove); touchTargets.delete(e.pointerId); }
}

function bounds() { return { w: W, h: courtH(state.doc.court) }; }

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

// 第二指觸碰時，取消第一指還沒結束的拖曳：若已經 pushUndo 就撤回（剛放置的新物件連同移除），已經移動的物件還原到拖曳前的位置。
function cancelSingleDrag() {
  const drag = state.drag;
  if (!drag) return;
  if (drag.created) {
    if (drag.pushed) history.popLast();
    step().items = step().items.filter(x => x !== drag.created); clearSel();
  } else if (drag.pushed) {
    const json = history.popLast();
    if (json) {
      state.doc = JSON.parse(json);
      state.doc.cur = Math.min(state.doc.cur, state.doc.steps.length - 1);
      state.ui.sels = state.ui.sels.filter(findObj);
      if (state.ui.sel && !findObj(state.ui.sel)) clearSel();
    }
  }
  updateHistory();
  state.drag = null;
}

function startPinch() {
  cancelSingleDrag();
  state.drag = { kind: 'pinch' };
  hooks.renderBoard(); hooks.renderProps();
}

// 兩指的中心點與距離都只用「目前這一幀」的單一 view／畫布版面快照換算，
// 不混用不同時間點的 getScreenCTM()，避免縮放時因為跨幀座標系不一致而亂跑。
// 用 getScreenCTM() 而不是 getBoundingClientRect() 換算 client → 場地座標：
// #board 在觸及 CSS max-height 時，SVG 的 preserveAspectRatio="xMidYMid meet" 會讓實際繪製
// 寬度小於外框 rect.width（左右留白），用 rect 線性換算會讓雙指縮放的錨點水平偏移（AC-18）；
// getScreenCTM() 已經把這個留白算進去，兩指的錨點與中心點都要在 renderBoard() 更新 viewBox
// 之前用同一份 CTM 換算，才會落在同一個座標系快照下。
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
    // anchor：上一幀兩指中心所對應的場地座標點，這一幀要讓它跟著移到新的兩指中心下面。
    const anchor = ptRaw(drag.lastCenter.x, drag.lastCenter.y);
    const cur = ptRaw(centerClient.x, centerClient.y);
    const scale = dist / drag.lastDist;
    const w = view.w / scale;
    const h = w * bd.h / bd.w;
    const rx = (cur.x - view.x) / view.w;
    const ry = (cur.y - view.y) / view.h;
    const prevX = view.x, prevY = view.y;
    state.view = clampView({ x: anchor.x - rx * w, y: anchor.y - ry * h, w, h }, bd);
    hooks.renderBoard();
    // 慣性滑行的取樣：跟 panMove 的場地單位分支用同一套「dx,dy」語意（inertiaApplyField 內部取負號套用）。
    trackVelocity(drag, prevX - state.view.x, prevY - state.view.y);
    drag.space = 'field';
  }
  drag.lastDist = dist; drag.lastCenter = centerClient;
}

function onPointerDown(e) {
  stopInertia(); // 手指再次按下時立即停止滑行。
  if (e.button !== 0) return;
  state.ui.touch = e.pointerType === 'touch';
  bindTouchTarget(e);
  if (state.anim) { hooks.stopAnim(); return; }
  if (e.pointerType === 'touch') {
    try { board.setPointerCapture(e.pointerId); } catch (err) {}
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) { startPinch(); return; }
    if (pointers.size > 2) return;
  }
  if (state.drag && state.drag.kind === 'pinch') return;
  const p = pt(e);
  const hEl = e.target.closest('[data-handle]'), gEl = e.target.closest('[data-id]');
  try { board.setPointerCapture(e.pointerId); } catch (err) {}
  const ui = state.ui;
  const multi = e.shiftKey || ui.multi;
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
    state.drag = { kind: 'new', moved: true, pushed: true, created: l };
    hooks.renderBoard(); return;
  }
  if (gEl) {
    const id = gEl.dataset.id;
    if (multi) { const ids = selIds(); setSelection(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); state.drag = null; hooks.renderBoard(); hooks.renderProps(); return; }
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
    state.drag = { kind: 'move', last: p, moved: true, pushed: true, created: it };
    hooks.renderBoard(); hooks.renderProps(); save(); return;
  }
  // 空白處用選取工具：開始框選（Shift 或多選模式保留目前的選取）。
  const base = multi ? selIds() : [];
  if (!multi) clearSel();
  // 觸控且非多選模式：不框選，單指拖曳＝捲動或平移畫面（014 修正：自己接管這個手勢，不再依賴
  // 瀏覽器原生捲動，避免「先放行捲動、兩指落下才切換成縮放」時與原生捲動手勢互相搶奪造成亂跑／
  // 跳動；放大時平移畫布，沒放大時捲動整個頁面，上下左右都會回應）。
  if (state.ui.touch && !multi) {
    state.drag = { kind: 'pan', last: { x: e.clientX, y: e.clientY } };
    hooks.renderBoard(); hooks.renderProps(); return;
  }
  state.drag = { kind: 'box', start: p, cur: p, base };
  hooks.renderBoard(); hooks.renderProps();
}

// 單指在空白處拖曳（選取工具、非多選模式）：放大時平移畫布，內容跟著手指；
// 沒放大時捲動整個頁面。用 getScreenCTM() 的縮放係數換算 client px → 場地單位的位移量，
// 不用換算座標點（跟 ptRaw 不同，這裡只需要「位移」，不需要「位置」）。
function panMove(e, drag) {
  const dxClient = e.clientX - drag.last.x, dyClient = e.clientY - drag.last.y;
  drag.last = { x: e.clientX, y: e.clientY };
  if (!dxClient && !dyClient) return;
  const bd = bounds();
  const view = state.view || defaultView(bd);
  if (zoomLevel(view, bd) > 1) {
    const m = board.getScreenCTM().inverse();
    const dx = dxClient * m.a + dyClient * m.c;
    const dy = dxClient * m.b + dyClient * m.d;
    state.view = panBy(view, -dx, -dy, bd);
    hooks.renderBoard();
    trackVelocity(drag, dx, dy); drag.space = 'field';
  } else {
    window.scrollBy(-dxClient, -dyClient);
    trackVelocity(drag, dxClient, dyClient); drag.space = 'client';
  }
}

function onPointerMove(e) {
  if (pointers.has(e.pointerId)) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (state.drag && state.drag.kind === 'pinch') { pinchMove(); return; }
  }
  const drag = state.drag;
  if (!drag || drag.kind === 'pinch') return;
  if (drag.kind === 'pan') { panMove(e, drag); return; }
  const p = pt(e);
  if (drag.kind === 'box') { drag.cur = p; setSelection([...drag.base, ...boxHits(drag.start, p)]); hooks.renderBoard(); return; }
  if (drag.kind === 'move') {
    const objs = selObjs(); if (!objs.length) return;
    const dx = p.x - drag.last.x, dy = p.y - drag.last.y; drag.last = p;
    if (!dx && !dy) return;
    if (!drag.moved) { pushUndo(); drag.moved = true; drag.pushed = true; }
    objs.forEach(o => shiftObj(o, dx, dy)); hooks.renderBoard(); return;
  }
  const o = getSel(); if (!o) return;
  if (!drag.moved) { pushUndo(); drag.moved = true; drag.pushed = true; }
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

function endDrag(e) {
  unbindTouchTarget(e);
  if (e && pointers.has(e.pointerId)) {
    pointers.delete(e.pointerId);
    if (state.drag && state.drag.kind === 'pinch') {
      if (pointers.size < 2) { const d = state.drag; state.drag = null; startInertiaFromDrag(d); }
      return;
    }
  }
  const drag = state.drag;
  if (!drag) return;
  if (drag.kind === 'pan') { state.drag = null; startInertiaFromDrag(drag); return; }
  const o = getSel();
  if (drag.kind === 'new' && o && Math.hypot(o.x2 - o.x1, o.y2 - o.y1) < 10) {
    step().items = step().items.filter(x => x !== o); clearSel(); history.popLast(); updateHistory();
  }
  const wasSize = drag.which === 'ts';
  state.drag = null; hooks.renderBoard();
  if (wasSize) { const o2 = getSel(), v = o2 && (o2.size || 18); if ($('#propSize')) { $('#propSize').value = v; $('#propSizeNum').value = v; } } else hooks.renderProps();
  save();
}

// CSS 的 touch-action 設為 none（見 css/touch.css），畫布範圍內一律自己接管捲動／縮放
// （014：不讓瀏覽器原生捲動參與決策，避免它跟兩指縮放互搶造成畫面亂跑／跳動）；
// 單指在空白處拖曳時 state.drag.kind 是 'pan'，一樣要擋掉原生行為，捲動／平移由 panMove() 處理。
function onTouchMove(e) {
  if (state.drag) e.preventDefault();
}

export function initEditor() {
  board = $('#board');
  board.addEventListener('pointerdown', onPointerDown);
  board.addEventListener('pointermove', onPointerMove);
  board.addEventListener('pointerup', endDrag);
  board.addEventListener('pointercancel', endDrag);
  board.addEventListener('touchmove', onTouchMove, { passive: false });
  board.addEventListener('dblclick', () => { const i = $('#propLabel'); if (i) { i.focus(); i.select(); } });
}
