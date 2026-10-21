// 匯出圖片用的整頁 SVG：標題、資訊列、各步驟圖板與說明、圖例（搬自舊版 Export 段落，參數化）。
import { W, FONT, f, esc } from './util.js';
import { COURTS, courtH } from './courts.js';
import { lineSVG, boardContent } from './render.js';

export function wrapText(str, maxUnits) {
  const out = [];
  for (const para of String(str || '').split(/\n/)) {
    let line = '', u = 0;
    for (const ch of para) {
      const w = /[\u0000-ÿ]/.test(ch) ? 0.55 : 1;
      if (u + w > maxUnits) { out.push(line); line = ''; u = 0; }
      line += ch; u += w;
    }
    out.push(line);
  }
  return out.filter((l, i, a) => l.length || (i > 0 && i < a.length - 1));
}

export function exportSVG(doc, indices, withNotes) {
  const pad = 40, WW = W + pad * 2, H = courtH(doc.court);
  let y = pad, body = '';
  const meta = [doc.grade, COURTS[doc.court].name, doc.players && `人數：${doc.players}`, doc.equipment && `器材：${doc.equipment}`, doc.duration && `時間：${doc.duration}`].filter(Boolean);
  body += `<text x="${pad}" y="${y + 30}" font-size="30" font-weight="700" fill="#16232a">${esc(doc.title || '體育教案')}</text>`;
  const metaLines = wrapText(meta.join('｜'), 62);
  metaLines.forEach((l, i) => { body += `<text x="${pad}" y="${y + 60 + i * 22}" font-size="15" fill="#4f5d63">${esc(l)}</text>`; });
  y += 60 + metaLines.length * 22 + 10;
  for (const i of indices) {
    const st = doc.steps[i];
    if (doc.steps.length > 1 || st.name) {
      body += `<rect x="${pad}" y="${y}" width="30" height="30" rx="15" fill="#16232a"/><text x="${pad + 15}" y="${y + 15.5}" font-size="16" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${i + 1}</text><text x="${pad + 42}" y="${y + 22}" font-size="20" font-weight="700" fill="#16232a">${esc(st.name || `步驟 ${i + 1}`)}</text>`;
      y += 42;
    }
    body += `<svg x="${pad}" y="${y}" width="${W}" height="${f(H)}" viewBox="0 0 ${W} ${f(H)}">${boardContent(doc.court, st, doc.iconScale, false)}</svg>`;
    y += H + 16;
    if (withNotes && st.note) {
      const lines = wrapText(st.note, 56);
      lines.forEach((l, j) => { body += `<text x="${pad}" y="${y + 18 + j * 27}" font-size="17" fill="#26343a">${esc(l)}</text>`; });
      y += lines.length * 27 + 8;
    }
    y += 18;
  }
  const leg = [['run', '跑動'], ['pass', '傳球'], ['dribble', '運球']];
  let lx = pad;
  for (const [t, n] of leg) {
    body += lineSVG({ type: t, x1: lx, y1: y + 10, x2: lx + 54, y2: y + 10, cx: lx + 27, cy: y + 10, color: '#16232a' }, false);
    body += `<text x="${lx + 64}" y="${y + 15}" font-size="15" fill="#4f5d63">${n}</text>`;
    lx += 140;
  }
  y += 30 + pad / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WW}" height="${Math.ceil(y)}" viewBox="0 0 ${WW} ${Math.ceil(y)}" font-family='${FONT}'><rect width="100%" height="100%" fill="#ffffff"/>${body}</svg>`;
}
