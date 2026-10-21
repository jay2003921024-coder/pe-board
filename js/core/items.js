// 物件與線條的定義與單一物件外觀（shape）。
import { esc } from './util.js';

export const TEAMS = {
  red:    { name: '紅隊', fill: '#d6453d', stroke: '#8f2420', text: '#fff' },
  blue:   { name: '藍隊', fill: '#2f6fd0', stroke: '#1a4489', text: '#fff' },
  yellow: { name: '黃隊', fill: '#f2c230', stroke: '#9b7a10', text: '#1b1b1b' },
  green:  { name: '綠隊', fill: '#2e9a5a', stroke: '#1a6038', text: '#fff' },
  white:  { name: '白隊', fill: '#f6f6f2', stroke: '#6b6b66', text: '#1b1b1b' },
};
export const INKS = [
  { c: '#141414', name: '黑' }, { c: '#ffffff', name: '白' }, { c: '#d6332b', name: '紅' },
  { c: '#1f5fbf', name: '藍' }, { c: '#f2c230', name: '黃' },
];
export const ITEMS = {
  player:  { name: '學生', r: 18 },
  teacher: { name: '老師', r: 19 },
  cone:    { name: '三角錐', r: 16 },
  disc:    { name: '標誌盤', r: 13 },
  ball:    { name: '球', r: 12 },
  hoop:    { name: '呼拉圈', r: 21 },
  hurdle:  { name: '跨欄', r: 21, rot: true },
  ladder:  { name: '繩梯', r: 42, rot: true },
  goal:    { name: '小球門', r: 26, rot: true },
  mat:     { name: '軟墊', r: 36, rot: true },
  kick:    { name: '浮板', r: 14, rot: true },
  text:    { name: '文字', r: 16 },
};
export const LINES = {
  run:     { name: '跑動' },
  pass:    { name: '傳球' },
  dribble: { name: '運球' },
  zone:    { name: '區域' },
};
export const isLine = o => o && LINES[o.type];

export function shape(it) {
  const mid = 'text-anchor="middle" dominant-baseline="central" font-weight="700"';
  switch (it.type) {
    case 'player': {
      const t = TEAMS[it.team] || TEAMS.red, lab = String(it.label ?? '');
      return `<circle r="14" fill="${t.fill}" stroke="${t.stroke}" stroke-width="2.5"/><text y="0.5" font-size="${lab.length > 2 ? 9 : lab.length > 1 ? 12 : 14}" fill="${t.text}" ${mid}>${esc(lab)}</text>`;
    }
    case 'teacher': return `<circle r="15" fill="#1f2328" stroke="#f2c230" stroke-width="3"/><text y="0.5" font-size="14" fill="#f2c230" ${mid}>師</text>`;
    case 'cone': return `<path d="M0 -13L10 10H-10Z" fill="#f07a1a" stroke="#a84a08" stroke-width="1.5" stroke-linejoin="round"/><path d="M-5.2 -1H5.2" stroke="#fff" stroke-width="2.5"/>`;
    case 'disc': return `<ellipse rx="10" ry="6" fill="#f2c230" stroke="#9b7a10" stroke-width="1.5"/><ellipse rx="3.5" ry="2" fill="#9b7a10" opacity="0.5"/>`;
    case 'ball': return `<circle r="8" fill="${it.color || '#e07a2c'}" stroke="#2a2a2a" stroke-width="1.5"/><path d="M-8 0H8M0 -8V8" stroke="#2a2a2a" stroke-width="1" opacity="0.5"/>`;
    case 'hoop': return `<circle r="17" fill="none" stroke="#5a1a40" stroke-width="6" opacity="0.35"/><circle r="17" fill="none" stroke="#e04aa8" stroke-width="4"/>`;
    case 'hurdle': return `<rect x="-18" y="-3.5" width="36" height="7" fill="#fff" stroke="#b8322a" stroke-width="1.5"/><path d="M-9 -3.5v7M0 -3.5v7M9 -3.5v7" stroke="#b8322a" stroke-width="3"/>`;
    case 'ladder': {
      const rails = 'M-9 -40V40M9 -40V40', rungs = 'M-9 -30H9M-9 -15H9M-9 0H9M-9 15H9M-9 30H9';
      return `<path d="${rails} ${rungs}" stroke="#4a3a00" stroke-width="5" stroke-linecap="round"/><path d="${rails} ${rungs}" stroke="#f2c230" stroke-width="2.6" stroke-linecap="round"/>`;
    }
    case 'goal': return `<rect x="-6" y="-24" width="12" height="48" fill="rgba(255,255,255,0.35)" stroke="#222" stroke-width="5"/><rect x="-6" y="-24" width="12" height="48" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M-6 -12H6M-6 0H6M-6 12H6M0 -24V24" stroke="#fff" stroke-width="1" opacity="0.7"/>`;
    case 'mat': return `<rect x="-24" y="-32" width="48" height="64" rx="3" fill="#3f78d6" stroke="#1d4a91" stroke-width="2"/><text font-size="13" fill="#fff" ${mid}>${esc(it.label || '軟墊')}</text>`;
    case 'kick': return `<rect x="-7.5" y="-11" width="15" height="22" rx="6" fill="#f6f6f2" stroke="#1f5fbf" stroke-width="2.2"/><rect x="-4" y="-7.5" width="8" height="5" rx="2" fill="#1f5fbf" opacity="0.55"/>`;
    case 'text': {
      const halo = (it.color || '#141414').toLowerCase() === '#ffffff' ? '#141414' : '#ffffff';
      return `<text font-size="${it.size || 18}" fill="${it.color || '#141414'}" stroke="${halo}" stroke-width="4" paint-order="stroke" stroke-linejoin="round" ${mid}>${esc(it.label || '文字')}</text>`;
    }
  }
  return '';
}
export const textUnits = s => [...String(s || '')].reduce((n, ch) => n + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1), 0);
export const textHalfW = it => Math.max(8, textUnits(it.label || '文字') * (it.size || 18) / 2);
export const TEXT_MIN = 8, TEXT_MAX = 120;
export const clampSize = v => Math.max(TEXT_MIN, Math.min(TEXT_MAX, Math.round(v)));
export function selR(it) {
  if (it.type === 'text') return Math.max(16, textHalfW(it) + 6);
  return ITEMS[it.type].r;
}
