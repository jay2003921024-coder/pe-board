// 工具列：工具按鈕、隊伍與線條色票、提示文字、復原／重做按鈕。
import { COURTS } from '../core/courts.js';
import { TEAMS, INKS, ITEMS, LINES } from '../core/items.js';
import { iconSVG as coreIconSVG } from '../core/render.js';
import { $, state, hooks, doUndo, doRedo } from './state.js';

// 目前隊伍與場地的球色決定工具圖示的顏色（舊版 iconSVG 讀閉包的 ui.team、doc.court）。
export const iconSVG = type => coreIconSVG(type, { team: state.ui.team, ballColor: COURTS[state.doc.court].ball });

export const KEYS = { v: 'select', s: 'player', t: 'teacher', c: 'cone', b: 'ball', x: 'text', r: 'run', p: 'pass', d: 'dribble', z: 'zone' };
const keyOf = t => Object.keys(KEYS).find(k => KEYS[k] === t);

export function renderTools() {
  const ui = state.ui;
  const btn = (t, name, cls = '') => `<button type="button" class="tool ${cls}" data-tool="${t}" aria-pressed="${ui.tool === t}" title="${name}${keyOf(t) ? `（快捷鍵 ${keyOf(t).toUpperCase()}）` : ''}">${keyOf(t) ? `<kbd class="tkey">${keyOf(t).toUpperCase()}</kbd>` : ''}${t === 'select' ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 2l11 7-5 1.2L12.6 16l-2.2 1-2.6-5.6L4 15z" fill="currentColor"/></svg>' : iconSVG(t)}<span>${name}</span></button>`;
  $('#tools').innerHTML = `
    <div class="tg"><h3>操作</h3><div class="tg-grid">${btn('select', '選取／移動', 'wide')}</div></div>
    <div class="tg"><h3>人員</h3><div class="tg-grid">${btn('player', '學生')}${btn('teacher', '老師')}</div>
      <div class="sw-label">學生隊伍顏色</div>
      <div class="swatches">${Object.entries(TEAMS).map(([k, t]) => `<button type="button" class="sw" data-team="${k}" style="background:${t.fill}" aria-pressed="${ui.team === k}" title="${t.name}" aria-label="${t.name}"></button>`).join('')}</div></div>
    <div class="tg"><h3>器材</h3><div class="tg-grid">${['cone', 'disc', 'ball', 'hoop', 'hurdle', 'ladder', 'goal', 'mat', 'kick', 'text'].map(t => btn(t, ITEMS[t].name)).join('')}</div></div>
    <div class="tg"><h3>路線</h3><div class="tg-grid">${Object.keys(LINES).map(t => btn(t, LINES[t].name)).join('')}</div>
      <div class="sw-label">線條顏色</div>
      <div class="swatches">${INKS.map(i => `<button type="button" class="sw" data-ink="${i.c}" style="background:${i.c}" aria-pressed="${ui.ink === i.c}" title="${i.name}" aria-label="${i.name}色"></button>`).join('')}</div></div>`;
}

export const HINTS = {
  select: '在空白處拖曳可框選多個物件，<kbd>Shift</kbd>+點選加入或移除，<kbd>Ctrl</kbd>+<kbd>A</kbd> 全選。拖曳任一個選取的物件會一起移動。',
  player: '點一下放置學生，會依隊伍自動編號；可以連續放置。按 <kbd>V</kbd> 或 <kbd>Esc</kbd> 回到選取。',
  teacher: '點一下放置老師的位置。',
  text: '點一下放置文字，再到右側修改內容。',
  zone: '在場上拖曳出一個區域，例如分站範圍或安全區，右側可以加上名稱。',
};
export function renderHint() {
  const t = state.ui.tool;
  $('#hint').innerHTML = HINTS[t] || (LINES[t] ? `在場上拖曳畫出${LINES[t].name}路線，放開就完成。起點可以直接從學生身上拉出來。` : `點一下放置${ITEMS[t].name}，可以連續放置。按 <kbd>V</kbd> 或 <kbd>Esc</kbd> 回到選取。`);
}

export function setTool(t) { hooks.stopAnim(); state.ui.tool = t; renderTools(); hooks.renderBoard(); renderHint(); }

export function initToolbar() {
  hooks.renderTools = renderTools;
  hooks.renderHint = renderHint;
  $('#tools').addEventListener('click', e => {
    const ui = state.ui, b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    if (b.dataset.team) { ui.team = b.dataset.team; if (ui.tool !== 'player') ui.tool = 'player'; renderTools(); hooks.renderBoard(); renderHint(); }
    if (b.dataset.ink) { ui.ink = b.dataset.ink; renderTools(); }
  });
  $('#btnUndo').addEventListener('click', doUndo);
  $('#btnRedo').addEventListener('click', doRedo);
}
