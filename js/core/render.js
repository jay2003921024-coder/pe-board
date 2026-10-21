// 物件、線條、整張圖板與工具圖示的 SVG 字串。
import { FONT, f, esc } from './util.js';
import { courtSVG } from './courts.js';
import { LINES, shape, selR } from './items.js';

export function itemSVG(it, k, hit) {
  const r = it.rot ? ` rotate(${it.rot})` : '';
  const pad = hit ? `<circle r="${f(selR(it) * 0.9)}" fill="transparent"/>` : '';
  return `<g ${hit ? `data-id="${it.id}" ` : ''}transform="translate(${f(it.x)} ${f(it.y)})${r} scale(${k})">${pad}${shape(it)}</g>`;
}

export const qpt = (t, l) => { const u = 1 - t; return [u * u * l.x1 + 2 * u * t * l.cx + t * t * l.x2, u * u * l.y1 + 2 * u * t * l.cy + t * t * l.y2]; };
export const qder = (t, l) => [2 * (1 - t) * (l.cx - l.x1) + 2 * t * (l.x2 - l.cx), 2 * (1 - t) * (l.cy - l.y1) + 2 * t * (l.y2 - l.cy)];

export function lineSVG(l, hit) {
  const c = l.color || '#141414';
  const id = hit ? `data-id="${l.id}" ` : '';
  if (l.type === 'zone') {
    const x = Math.min(l.x1, l.x2), y = Math.min(l.y1, l.y2), w = Math.abs(l.x2 - l.x1), h = Math.abs(l.y2 - l.y1);
    const halo = c.toLowerCase() === '#ffffff' ? '#141414' : '#ffffff';
    const lab = l.label ? `<text x="${f(x + 8)}" y="${f(y + 18)}" font-size="15" font-weight="700" fill="${c}" stroke="${halo}" stroke-width="3.5" paint-order="stroke">${esc(l.label)}</text>` : '';
    // Zones are grabbed by their edge or label only, so a box selection can start inside them.
    const edge = hit ? `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="6" fill="none" stroke="transparent" stroke-width="16"/>` : '';
    return `<g ${id}><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="6" fill="${c}" fill-opacity="0.16" stroke="${c}" stroke-width="2.5" stroke-dasharray="10 6"${hit ? ' pointer-events="none"' : ''}/>${edge}${lab}</g>`;
  }
  let [dx, dy] = qder(1, l), d = Math.hypot(dx, dy);
  if (d < 1) { dx = l.x2 - l.x1; dy = l.y2 - l.y1; d = Math.hypot(dx, dy) || 1; }
  const ux = dx / d, uy = dy / d, AL = 15, AW = 7.5;
  const bx = l.x2 - ux * AL, by = l.y2 - uy * AL;
  const head = `<path d="M${f(l.x2)} ${f(l.y2)}L${f(bx - uy * AW)} ${f(by + ux * AW)}L${f(bx + uy * AW)} ${f(by - ux * AW)}Z" fill="${c}"/>`;
  const curve = `M${f(l.x1)} ${f(l.y1)}Q${f(l.cx)} ${f(l.cy)} ${f(bx)} ${f(by)}`;
  let body;
  if (l.type === 'dribble') {
    const seg = { x1: l.x1, y1: l.y1, cx: l.cx, cy: l.cy, x2: bx, y2: by };
    const N = 90, pts = [];
    let prev = qpt(0, seg), len = 0;
    const samples = [];
    for (let i = 0; i <= N; i++) { const p = qpt(i / N, seg); len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; samples.push([p, len]); }
    samples.forEach(([p, s], i) => {
      let [tx, ty] = qder(i / N, seg); const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const taper = Math.min(1, s / 10, (len - s) / 10);
      const a = 5.5 * Math.sin(s / 15 * Math.PI * 2) * taper;
      pts.push(`${f(p[0] - ty * a)} ${f(p[1] + tx * a)}`);
    });
    body = `<path d="M${pts.join('L')}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  } else {
    body = `<path d="${curve}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"${l.type === 'pass' ? ' stroke-dasharray="9 7"' : ''}/>`;
  }
  const hitPath = hit ? `<path d="M${f(l.x1)} ${f(l.y1)}Q${f(l.cx)} ${f(l.cy)} ${f(l.x2)} ${f(l.y2)}" fill="none" stroke="transparent" stroke-width="18"/>` : '';
  return `<g ${id}>${hitPath}${body}${head}</g>`;
}

export function boardContent(courtId, st, k, hit) {
  const zones = [], lines = [], items = [], texts = [];
  for (const o of st.items) {
    if (o.type === 'zone') zones.push(lineSVG(o, hit));
    else if (LINES[o.type]) lines.push(lineSVG(o, hit));
    else if (o.type === 'text') texts.push(itemSVG(o, k, hit));
    else items.push(itemSVG(o, k, hit));
  }
  return `<g font-family='${FONT}'>${courtSVG(courtId)}${zones.join('')}${lines.join('')}${items.join('')}${texts.join('')}</g>`;
}

// 舊版讀全域 ui.team 與 COURTS[doc.court].ball，這裡改成參數。
export function iconSVG(type, { team = 'red', ballColor } = {}) {
  if (LINES[type]) {
    const l = { type, x1: -16, y1: 10, x2: 16, y2: -10, cx: -2, cy: -14, color: 'currentColor' };
    if (type === 'zone') { Object.assign(l, { x1: -15, y1: -11, x2: 15, y2: 11 }); }
    const s = lineSVG(l, false).replace(/stroke-width="3"/g, 'stroke-width="2.4"').replace('stroke-dasharray="9 7"', 'stroke-dasharray="5 4"');
    return `<svg viewBox="-22 -22 44 44" aria-hidden="true">${s}</svg>`;
  }
  const it = { type, team, label: type === 'player' ? '1' : type === 'text' ? 'Aa' : '', color: ballColor, size: 16 };
  const fit = { ladder: 0.5, mat: 0.55, goal: 0.75, hoop: 1, text: 1 }[type] || 1.2;
  const rot = type === 'ladder' || type === 'goal' || type === 'kick' ? 90 : 0;
  return `<svg viewBox="-22 -22 44 44" aria-hidden="true"><g font-family='${FONT}' transform="rotate(${rot}) scale(${fit})">${shape(it)}</g></svg>`;
}
