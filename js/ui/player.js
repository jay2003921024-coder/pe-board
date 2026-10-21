// 步驟間動畫播放：進度合成、字幕、播放／停止（搬自舊版 1063～1172；配對/路徑/緩動邏輯見 core/anim.js）。
import { FONT, esc } from '../core/util.js';
import { courtSVG } from '../core/courts.js';
import { lineSVG, itemSVG } from '../core/render.js';
import { isLine } from '../core/items.js';
import { planTransition, posAt, ease } from '../core/anim.js';
import { $, state, hooks, clearSel, renderAll } from './state.js';

let board;

function composite(zones, lines, items, k) {
  const op = (svg, o) => o >= 0.999 ? svg : o <= 0.001 ? '' : `<g opacity="${o.toFixed(3)}">${svg}</g>`;
  const its = items.filter(([o]) => o.type !== 'text').concat(items.filter(([o]) => o.type === 'text'));
  return `<g font-family='${FONT}'>${courtSVG(state.doc.court)}${zones.map(([o, v]) => op(lineSVG(o, false), v)).join('')}${lines.map(([o, v]) => op(lineSVG(o, false), v)).join('')}${its.map(([o, v]) => op(itemSVG(o, k, false), v)).join('')}</g>`;
}

function caption(i) {
  const doc = state.doc;
  const s = `步驟 ${i + 1}・${doc.steps[i].name || '未命名'}`;
  const w = [...s].reduce((n, ch) => n + (/[\u0000-ÿ]/.test(ch) ? 8.5 : 16), 0) + 28;
  return `<g font-family='${FONT}' pointer-events="none"><rect x="14" y="14" width="${w}" height="32" rx="16" fill="rgba(16,24,28,0.82)"/><text x="28" y="30.5" font-size="16" font-weight="700" fill="#fff" dominant-baseline="central">${esc(s)}</text></g>`;
}

function animFrame(now) {
  const anim = state.anim;
  if (!anim) return;
  const doc = state.doc;
  const sp = +$('#speed').value || 1, HOLD = 1500 / sp, MOVE = 1700 / sp, k = doc.iconScale;
  let t = now - anim.t0, i = anim.start;
  while (true) {
    if (t < HOLD) { // 顯示第 i 步與它的箭頭
      const st = doc.steps[i].items, fade = Math.min(1, t / 250);
      board.innerHTML = composite(st.filter(o => o.type === 'zone').map(o => [o, 1]), st.filter(o => isLine(o) && o.type !== 'zone').map(o => [o, i === anim.start ? 1 : fade]), st.filter(o => !isLine(o)).map(o => [o, 1]), k) + caption(i);
      if (doc.cur !== i) { doc.cur = i; hooks.renderSteps(); }
      break;
    }
    t -= HOLD;
    if (i >= doc.steps.length - 1) { stopAnim(); return; }
    if (t < MOVE) { // 從第 i 步移動到第 i+1 步
      const p = anim.plans[i] ||= planTransition(doc, i), e = ease(t / MOVE);
      board.innerHTML = composite(
        [...p.zonesKeep.map(o => [o, 1]), ...p.zonesOut.map(o => [o, 1 - e]), ...p.zonesIn.map(o => [o, e])],
        p.linesOut.map(o => [o, Math.max(0, 1 - e * 3)]),
        [...p.moves.map(m => [posAt(m, e), 1]), ...p.gone.map(o => [o, 1 - e]), ...p.appear.map(o => [o, e])], k) + caption(e < 0.5 ? i : i + 1);
      break;
    }
    t -= MOVE; i++;
  }
  anim.raf = requestAnimationFrame(animFrame);
}

function startAnim() {
  const doc = state.doc;
  if (doc.steps.length < 2) return;
  clearSel(); hooks.renderProps();
  const start = doc.cur >= doc.steps.length - 1 ? 0 : doc.cur;
  state.anim = { start, t0: performance.now(), plans: {} };
  board.classList.add('animating');
  const pb = $('#btnPlay'); pb.textContent = '■ 停止'; pb.setAttribute('aria-pressed', 'true');
  $('#hint').textContent = '播放中：人和球會沿著上一步畫的箭頭移動。點畫面或按「停止」結束。';
  state.anim.raf = requestAnimationFrame(animFrame);
}

function stopAnim() {
  if (!state.anim) return;
  cancelAnimationFrame(state.anim.raf); state.anim = null;
  board.classList.remove('animating');
  const pb = $('#btnPlay'); pb.textContent = '▶ 播放動畫'; pb.setAttribute('aria-pressed', 'false');
  hooks.syncInputs(); renderAll();
}

export function initPlayer() {
  board = $('#board');
  hooks.stopAnim = stopAnim;
  $('#btnPlay').addEventListener('click', () => state.anim ? stopAnim() : startAnim());
}
