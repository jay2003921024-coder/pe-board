// 14 種場地：以公尺繪製，縮放到 1000 寬的畫布。COURTS 的插入順序決定場地選單的分組與排序。
import { W, f } from './util.js';

export const COURTS = {};
const C = (id, o) => { COURTS[id] = o; };
const g = (lw, inner, stroke = '#fff') => `<g fill="none" stroke="${stroke}" stroke-width="${lw}" stroke-linejoin="round">${inner}</g>`;
const mirror = (L, inner) => `<g transform="matrix(-1 0 0 1 ${L} 0)">${inner}</g>`;

const bbEnd = lw => `<rect x="0" y="5.05" width="5.8" height="4.9" fill="#b8643a"/><circle cx="5.8" cy="7.5" r="1.8"/><path d="M0 0.9H2.99A6.75 6.75 0 0 1 2.99 14.1H0"/><line x1="1.2" y1="6.6" x2="1.2" y2="8.4" stroke-width="${lw * 2}"/><circle cx="1.575" cy="7.5" r="0.23" stroke="#e8562a" stroke-width="${lw * 1.4}"/>`;

C('bb-half', { name: '籃球（半場）', group: '球類', L: 15, B: 14, m: 2, bg: '#b37d48', ball: '#e07a2c',
  draw: lw => `<g transform="matrix(0 1 1 0 0 0)"><rect width="14" height="15" fill="#dcaa6f"/>${g(lw, bbEnd(lw) + '<path d="M14 5.7A1.8 1.8 0 0 0 14 9.3"/><rect width="14" height="15"/>')}</g>` });
C('bb-full', { name: '籃球（全場）', group: '球類', L: 28, B: 15, m: 2, bg: '#b37d48', ball: '#e07a2c',
  draw: lw => `<rect width="28" height="15" fill="#dcaa6f"/>${g(lw, bbEnd(lw) + mirror(28, bbEnd(lw)) + '<line x1="14" y1="0" x2="14" y2="15"/><circle cx="14" cy="7.5" r="1.8"/><rect width="28" height="15"/>')}` });
C('volleyball', { name: '排球', group: '球類', L: 18, B: 9, m: 3, bg: '#2f6fae', ball: '#f3d34a',
  draw: lw => `<rect width="18" height="9" fill="#e3843f"/>${g(lw, '<rect width="18" height="9"/><line x1="6" y1="0" x2="6" y2="9"/><line x1="12" y1="0" x2="12" y2="9"/><line x1="9" y1="0" x2="9" y2="9"/>')}<line x1="9" y1="-1" x2="9" y2="10" stroke="#1d2226" stroke-width="${lw * 2.4}"/><circle cx="9" cy="-1" r="0.22" fill="#1d2226"/><circle cx="9" cy="10" r="0.22" fill="#1d2226"/>` });
C('badminton', { name: '羽球', group: '球類', L: 13.4, B: 6.1, m: 2, bg: '#22594a', ball: '#ffffff',
  draw: lw => `<rect width="13.4" height="6.1" fill="#2f8a62"/>${g(lw, '<rect width="13.4" height="6.1"/><line x1="0" y1="0.46" x2="13.4" y2="0.46"/><line x1="0" y1="5.64" x2="13.4" y2="5.64"/><line x1="4.72" y1="0" x2="4.72" y2="6.1"/><line x1="8.68" y1="0" x2="8.68" y2="6.1"/><line x1="0.76" y1="0" x2="0.76" y2="6.1"/><line x1="12.64" y1="0" x2="12.64" y2="6.1"/><line x1="0" y1="3.05" x2="4.72" y2="3.05"/><line x1="8.68" y1="3.05" x2="13.4" y2="3.05"/>')}<line x1="6.7" y1="-0.3" x2="6.7" y2="6.4" stroke="#14211c" stroke-width="${lw * 2.2}"/>` });
C('tabletennis', { name: '桌球', group: '球類', L: 14, B: 7, m: 1, bg: '#5d2328', ball: '#ff9a2e',
  draw: lw => `<rect width="14" height="7" fill="#9a3439" stroke="#fff" stroke-width="${lw * 0.8}"/><rect x="5.63" y="2.7375" width="2.74" height="1.525" fill="#1c5aa3" stroke="#fff" stroke-width="${lw}"/><line x1="5.63" y1="3.5" x2="8.37" y2="3.5" stroke="#fff" stroke-width="${lw * 0.6}"/><line x1="7" y1="2.6" x2="7" y2="4.4" stroke="#111" stroke-width="${lw * 1.8}"/>` });
C('tennis', { name: '網球', group: '球類', L: 23.77, B: 10.97, m: 4, bg: '#3d7f52', ball: '#d7e84a',
  draw: lw => `<rect width="23.77" height="10.97" fill="#2c66ad"/>${g(lw, '<rect width="23.77" height="10.97"/><line x1="0" y1="1.37" x2="23.77" y2="1.37"/><line x1="0" y1="9.6" x2="23.77" y2="9.6"/><line x1="5.485" y1="1.37" x2="5.485" y2="9.6"/><line x1="18.285" y1="1.37" x2="18.285" y2="9.6"/><line x1="5.485" y1="5.485" x2="18.285" y2="5.485"/><line x1="0" y1="5.485" x2="0.3" y2="5.485"/><line x1="23.47" y1="5.485" x2="23.77" y2="5.485"/>')}<line x1="11.885" y1="-0.9" x2="11.885" y2="11.87" stroke="#152130" stroke-width="${lw * 2.2}"/>` });
const socEnd = '<rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><circle cx="11" cy="34" r="0.3" fill="#fff"/><path d="M16.5 26.69A9.15 9.15 0 0 1 16.5 41.31"/><rect x="-2" y="30.34" width="2" height="7.32" fill="rgba(255,255,255,0.3)"/><path d="M1 0A1 1 0 0 1 0 1M0 67A1 1 0 0 1 1 68"/>';
C('soccer', { name: '足球', group: '球類', L: 105, B: 68, m: 4, bg: '#357d3e', ball: '#ffffff',
  draw: lw => `<rect width="105" height="68" fill="#3c8a45"/>${Array.from({length: 7}, (_, i) => `<rect x="${i * 15}" y="0" width="7.5" height="68" fill="#44944c"/>`).join('')}${g(lw, '<rect width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><circle cx="52.5" cy="34" r="0.3" fill="#fff"/>' + socEnd + mirror(105, socEnd))}` });
const hbEnd = '<path d="M0 2.5A6 6 0 0 1 6 8.5L6 11.5A6 6 0 0 1 0 17.5Z" fill="#d88a3a"/><path d="M2.96 0A9 9 0 0 1 9 8.5L9 11.5A9 9 0 0 1 2.96 20" stroke-dasharray="0.6 0.6"/><line x1="7" y1="9.5" x2="7" y2="10.5"/><rect x="-1" y="8.5" width="1" height="3" fill="rgba(255,255,255,0.3)"/>';
C('handball', { name: '手球／五人制足球', group: '球類', L: 40, B: 20, m: 3, bg: '#285a92', ball: '#f4f4f4',
  draw: lw => `<rect width="40" height="20" fill="#3a72b2"/>${g(lw, hbEnd + mirror(40, hbEnd) + '<line x1="20" y1="0" x2="20" y2="20"/><circle cx="20" cy="10" r="3"/><rect width="40" height="20"/>')}` });
C('dodgeball', { name: '躲避球', group: '球類', L: 20, B: 10, m: 4, bg: '#3f6f5c', ball: '#e8463a',
  draw: (lw, s) => `<rect width="20" height="10" fill="#5f9a7d"/>${g(lw, '<rect width="20" height="10"/><line x1="10" y1="0" x2="10" y2="10"/>')}<rect x="-2.6" y="-2.6" width="25.2" height="15.2" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="${lw * 0.8}" stroke-dasharray="0.5 0.4"/><g fill="rgba(255,255,255,0.55)" font-size="${17 / s}" font-weight="700" text-anchor="middle"><text x="5" y="5.3">A 隊內場</text><text x="15" y="5.3">B 隊內場</text><text x="10" y="-3.1">外場</text><text x="10" y="13.7">外場</text></g>` });
C('softball', { name: '壘球／樂樂棒球', group: '球類', L: 70, B: 56, m: 1, bg: '#3f8547', ball: '#fff6d8',
  draw: (lw, s) => {
    const base = (x, y) => `<rect x="-0.45" y="-0.45" width="0.9" height="0.9" fill="#fff" transform="translate(${x} ${y}) rotate(45)"/>`;
    return `<path d="M35 52L1.059 18.059A48 48 0 0 1 68.941 18.059Z" fill="#4c9a53"/><path d="M35 52L15.201 32.201A28 28 0 0 1 54.799 32.201Z" fill="#c48a55"/><path d="M35 49L45 39.067L35 29.13L25 39.067Z" fill="#4c9a53"/><circle cx="35" cy="38.89" r="2.4" fill="#d39a63"/>${g(lw, '<path d="M35 52L1.059 18.059M35 52L68.941 18.059"/><path d="M1.059 18.059A48 48 0 0 1 68.941 18.059"/><path d="M35 52L47.933 39.067L35 26.134L22.067 39.067Z" stroke-opacity="0.75"/>')}${base(47.933, 39.067)}${base(35, 26.134)}${base(22.067, 39.067)}<path d="M34.55 51.55h0.9v0.45l-0.45 0.45l-0.45 -0.45Z" fill="#fff"/><g fill="rgba(255,255,255,0.85)" font-size="${14 / s}" font-weight="700" text-anchor="middle"><text x="51" y="40">一壘</text><text x="35" y="24.3">二壘</text><text x="19" y="40">三壘</text><text x="35" y="55.4">本壘</text></g>`;
  } });
const TR = { cy: 23.22, x1: 23.22, x2: 73.22, r0: 15.9, lane: 1.22 };
const stad = r => `M${TR.x1} ${f(TR.cy - r * 1)}H${TR.x2}A${r} ${r} 0 0 1 ${TR.x2} ${TR.cy + r}H${TR.x1}A${r} ${r} 0 0 1 ${TR.x1} ${TR.cy - r}Z`;
C('track', { name: '田徑操場（200 公尺）', group: '田徑', L: 96.44, B: 46.44, m: 3, bg: '#6f8f6a', ball: '#ffffff',
  draw: (lw, s) => `<path d="${stad(23.22)}" fill="#b8533c"/><path d="${stad(15.9)}" fill="#4f9a52"/>${g(lw * 0.8, Array.from({length: 7}, (_, i) => `<path d="${stad(f(15.9 + 1.22 * i))}"/>`).join(''))}<line x1="73.22" y1="0" x2="73.22" y2="7.32" stroke="#fff" stroke-width="${lw * 2.4}"/><text x="73.22" y="-0.9" fill="#fff" font-size="${14 / s}" font-weight="700" text-anchor="middle">起終點</text>` });
C('gym', { name: '體育館空地（20×12 公尺）', group: '空白場地', L: 20, B: 12, m: 1, bg: '#bfc3ba', ball: '#e07a2c',
  draw: (lw, s) => {
    let grid = '';
    for (let x = 1; x < 20; x++) grid += `<line x1="${x}" y1="0" x2="${x}" y2="12" stroke="${x % 5 ? 'rgba(30,40,40,0.10)' : 'rgba(30,40,40,0.28)'}"/>`;
    for (let y = 1; y < 12; y++) grid += `<line x1="0" y1="${y}" x2="20" y2="${y}" stroke="${y % 5 ? 'rgba(30,40,40,0.10)' : 'rgba(30,40,40,0.28)'}"/>`;
    return `<rect width="20" height="12" fill="#dde0d8"/>${g(lw * 0.6, grid, 'none')}<rect width="20" height="12" fill="none" stroke="#6f766f" stroke-width="${lw}"/><text x="20" y="12.75" fill="#4a514b" font-size="${13 / s}" text-anchor="end">1 格 ＝ 1 公尺</text>`;
  } });
C('grass', { name: '戶外草地（40×25 公尺）', group: '空白場地', L: 40, B: 25, m: 1, bg: '#3f7f43', ball: '#ffffff',
  draw: (lw, s) => {
    let st = '', grid = '';
    for (let x = 0; x < 40; x += 10) st += `<rect x="${x}" y="0" width="5" height="25" fill="#559e58"/>`;
    for (let x = 5; x < 40; x += 5) grid += `<line x1="${x}" y1="0" x2="${x}" y2="25"/>`;
    for (let y = 5; y < 25; y += 5) grid += `<line x1="0" y1="${y}" x2="40" y2="${y}"/>`;
    return `<rect width="40" height="25" fill="#4f9752"/>${st}${g(lw * 0.6, grid, 'rgba(255,255,255,0.22)')}<rect width="40" height="25" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="${lw}"/><text x="40" y="25.75" fill="rgba(255,255,255,0.85)" font-size="${13 / s}" text-anchor="end">1 格 ＝ 5 公尺</text>`;
  } });

C('pool', { name: '游泳池（25 公尺・6 水道）', group: '水上', L: 25, B: 15, m: 2.5, bg: '#cdd6da', ball: '#f2c230',
  draw: (lw, s) => {
    let h = `<rect x="-0.35" y="-0.35" width="25.7" height="15.7" rx="0.25" fill="#eef2f3"/><rect width="25" height="15" fill="#3d9fd8"/>`;
    for (let k = 0; k < 6; k++) {
      const c = 1.25 + 2.5 * k;
      h += `<path d="M2 ${c}H23M2 ${c - 0.5}V${c + 0.5}M23 ${c - 0.5}V${c + 0.5}" fill="none" stroke="#1d4f8c" stroke-width="${lw * 2.6}" opacity="0.6"/>`;
      h += `<text x="26.3" y="${c}" fill="#34464d" font-size="${15 / s}" font-weight="700" text-anchor="middle" dominant-baseline="central">${k + 1}</text>`;
    }
    for (let k = 1; k < 6; k++) {
      const y = 2.5 * k;
      h += `<line x1="0" y1="${y}" x2="25" y2="${y}" stroke="#ffffff" stroke-width="${lw * 2.4}" stroke-dasharray="0.45 0.45"/><line x1="0" y1="${y}" x2="25" y2="${y}" stroke="#d6332b" stroke-width="${lw * 2.4}" stroke-dasharray="0.45 0.45" stroke-dashoffset="0.45"/>`;
    }
    h += `<g stroke="rgba(255,255,255,0.6)" stroke-width="${lw * 0.8}" stroke-dasharray="0.3 0.3"><line x1="5" y1="-0.3" x2="5" y2="15.3"/><line x1="20" y1="-0.3" x2="20" y2="15.3"/></g>`;
    h += `<g fill="#4a5a60" font-size="${12 / s}" text-anchor="middle"><text x="5" y="-0.8">5 m</text><text x="20" y="-0.8">5 m</text><text x="-1.25" y="-0.8">出發端</text><text x="26.3" y="-0.8">水道</text></g>`;
    return h + `<rect width="25" height="15" fill="none" stroke="#ffffff" stroke-width="${lw * 1.5}"/>`;
  } });

export const scaleOf = id => { const c = COURTS[id]; return W / (c.L + 2 * c.m); };
export const courtH = id => { const c = COURTS[id]; return (c.B + 2 * c.m) * scaleOf(id); };
const courtCache = {};
export function courtSVG(id) {
  if (courtCache[id]) return courtCache[id];
  const c = COURTS[id], s = scaleOf(id);
  return courtCache[id] = `<rect width="${W}" height="${f(courtH(id))}" fill="${c.bg}"/><g transform="translate(${f(c.m * s)} ${f(c.m * s)}) scale(${s})">${c.draw(2.2 / s, s)}</g>`;
}
