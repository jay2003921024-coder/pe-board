// 畫布渲染：場地與物件、選取框、把手、框選矩形（互動在 editor.js）。
import { W, f } from '../core/util.js';
import { courtH } from '../core/courts.js';
import { isLine, selR, textHalfW } from '../core/items.js';
import { qpt, boardContent } from '../core/render.js';
import { $, state, hooks, step, getSel, selIds, selObjs } from './state.js';

let board;
export function handleR() { const w = board.getBoundingClientRect().width || W; return Math.max(8, 8 * W / w * 0.75); }

export function ring(o, k) {
  if (o.type === 'zone') {
    const x = Math.min(o.x1, o.x2) - 4, y = Math.min(o.y1, o.y2) - 4, w = Math.abs(o.x2 - o.x1) + 8, h = Math.abs(o.y2 - o.y1) + 8;
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="8" fill="none" stroke="#f2c230" stroke-width="3" stroke-dasharray="6 4"/>`;
  }
  if (isLine(o)) return `<path d="M${f(o.x1)} ${f(o.y1)}Q${f(o.cx)} ${f(o.cy)} ${f(o.x2)} ${f(o.y2)}" fill="none" stroke="#f2c230" stroke-width="9" stroke-linecap="round" opacity="0.55"/>`;
  if (o.type === 'text') {
    const hw = (textHalfW(o) + 6) * k, hh = ((o.size || 18) / 2 + 5) * k;
    return `<rect x="${f(o.x - hw)}" y="${f(o.y - hh)}" width="${f(hw * 2)}" height="${f(hh * 2)}" rx="4" fill="none" stroke="#141414" stroke-width="5" opacity="0.3"/><rect x="${f(o.x - hw)}" y="${f(o.y - hh)}" width="${f(hw * 2)}" height="${f(hh * 2)}" rx="4" fill="none" stroke="#f2c230" stroke-width="2.5" stroke-dasharray="6 4"/>`;
  }
  const r = selR(o) * k + 5;
  return `<circle cx="${f(o.x)}" cy="${f(o.y)}" r="${f(r)}" fill="none" stroke="#141414" stroke-width="5" opacity="0.35"/><circle cx="${f(o.x)}" cy="${f(o.y)}" r="${f(r)}" fill="none" stroke="#f2c230" stroke-width="2.5" stroke-dasharray="6 4"/>`;
}

export function overlay() {
  const { drag, doc, ui } = state;
  let out = '';
  if (drag && drag.kind === 'box') {
    const a = drag.start, b = drag.cur;
    out = `<rect x="${f(Math.min(a.x, b.x))}" y="${f(Math.min(a.y, b.y))}" width="${f(Math.abs(b.x - a.x))}" height="${f(Math.abs(b.y - a.y))}" fill="rgba(31,95,191,0.12)" stroke="#1f5fbf" stroke-width="1.5" stroke-dasharray="5 4" pointer-events="none"/>`;
  }
  const k = doc.iconScale;
  if (ui.sels.length) return `<g pointer-events="none">${selObjs().map(o => ring(o, k)).join('')}</g>` + out;
  const o = getSel(); if (!o) return out;
  const hr = handleR();
  if (o.type === 'text') {
    const hw = (textHalfW(o) + 6) * k, hh = ((o.size || 18) / 2 + 5) * k;
    return `<g pointer-events="none">${ring(o, k)}</g><g data-handle="ts"><rect x="${f(o.x + hw - hr * 0.8)}" y="${f(o.y + hh - hr * 0.8)}" width="${f(hr * 1.6)}" height="${f(hr * 1.6)}" rx="2" fill="#fff" stroke="#1f5fbf" stroke-width="${f(hr / 3)}" style="cursor:nwse-resize"/></g>` + out;
  }
  if (isLine(o)) {
    const h = (name, x, y, fill) => `<g data-handle="${name}"><circle cx="${f(x)}" cy="${f(y)}" r="${f(hr)}" fill="${fill}" stroke="#1f5fbf" stroke-width="${f(hr / 3)}"/></g>`;
    if (o.type === 'zone') return h('p1', o.x1, o.y1, '#fff') + h('p2', o.x2, o.y2, '#fff');
    const [mx, my] = qpt(0.5, o);
    return h('p1', o.x1, o.y1, '#fff') + h('p2', o.x2, o.y2, '#fff') + h('c', mx, my, '#f2c230');
  }
  return `<g pointer-events="none">${ring(o, k)}</g>` + out;
}

export function renderBoard() {
  const { doc, ui } = state;
  board.setAttribute('viewBox', `0 0 ${W} ${f(courtH(doc.court))}`);
  board.innerHTML = boardContent(doc.court, step(), doc.iconScale, true) + overlay();
  board.classList.toggle('placing', ui.tool !== 'select');
}

export function initBoard() {
  board = $('#board');
  hooks.renderBoard = renderBoard;
  window.addEventListener('resize', () => { if (selIds().length) renderBoard(); });
}
