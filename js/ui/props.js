// 屬性面板：單選/多選欄位、隊伍與顏色切換、拉直／反轉／旋轉、複製／刪除（搬自舊版 779～1001）。
import { uid, esc } from '../core/util.js';
import { COURTS } from '../core/courts.js';
import { TEAMS, INKS, ITEMS, LINES, isLine, clampSize, TEXT_MIN, TEXT_MAX } from '../core/items.js';
import { iconSVG } from '../core/render.js';
import { shiftObj, nextLabel } from '../core/doc.js';
import { $, state, hooks, step, getSel, selObjs, setSelection, clearSel, mutate, textEdit } from './state.js';

// 舊版 iconSVG 讀閉包的 ui.team、COURTS[doc.court].ball；這裡改由呼叫端傳入目前狀態。
function propIconSVG(type) {
  return iconSVG(type, { team: state.ui.team, ballColor: COURTS[state.doc.court].ball });
}

function sizeField(size) {
  return `<div class="field"><label for="propSize">字級</label><div class="row size-row"><button type="button" class="btn small" data-tstep="-2" aria-label="縮小">A−</button><input id="propSize" type="range" min="${TEXT_MIN}" max="${TEXT_MAX}" step="1" value="${size}"><input id="propSizeNum" type="number" min="${TEXT_MIN}" max="${TEXT_MAX}" value="${size}" aria-label="字級數值"><button type="button" class="btn small" data-tstep="2" aria-label="放大">A＋</button></div></div>`;
}

export function renderProps() {
  const box = $('#props'), objs = selObjs(), o = getSel();
  if (objs.length > 1) {
    let h = `<div class="prop-head"><span>已選取 ${objs.length} 個物件</span></div>`;
    if (objs.some(x => x.type === 'player')) h += `<div class="field"><label>學生隊伍</label><div class="swatches" style="margin:0">${Object.entries(TEAMS).map(([k, t]) => `<button type="button" class="sw" data-pteam="${k}" style="background:${t.fill}" aria-label="${t.name}" title="${t.name}"></button>`).join('')}</div></div>`;
    if (objs.some(x => isLine(x) || x.type === 'text')) h += `<div class="field"><label>線條與文字顏色</label><div class="swatches" style="margin:0">${INKS.map(i => `<button type="button" class="sw" data-pink="${i.c}" style="background:${i.c}" aria-label="${i.name}色" title="${i.name}"></button>`).join('')}</div></div>`;
    const texts = objs.filter(x => x.type === 'text');
    if (texts.length) h += sizeField(texts[0].size || 18);
    h += `<div class="row"><button type="button" class="btn small" data-act="dup">全部複製</button><button type="button" class="btn small danger" data-act="del">全部刪除</button></div>`;
    h += `<p class="empty" style="margin-top:10px">拖曳任一個選取的物件會一起移動；方向鍵也可以一起微調。</p>`;
    box.innerHTML = h; return;
  }
  if (!o) {
    box.innerHTML = `<p class="empty">點選場上的人、器材或路線，就能在這裡修改編號、顏色和方向。在空白處拖曳可以框選多個。<br><kbd>V</kbd> 選取工具　<kbd>Ctrl</kbd>+<kbd>Z</kbd> 復原　<kbd>Ctrl</kbd>+<kbd>D</kbd> 複製　<kbd>Delete</kbd> 刪除</p>`;
    return;
  }
  const name = (ITEMS[o.type] || LINES[o.type]).name;
  let h = `<div class="prop-head">${propIconSVG(o.type)}<span>${name}</span></div>`;
  if (['player', 'text', 'zone', 'mat'].includes(o.type)) {
    const lab = { player: '編號或名字', text: '文字內容', zone: '區域名稱', mat: '標示文字' }[o.type];
    h += `<div class="field"><label for="propLabel">${lab}</label><input id="propLabel" type="text" value="${esc(o.label ?? '')}" maxlength="30"></div>`;
  }
  if (o.type === 'player') {
    h += `<div class="field"><label>隊伍</label><div class="swatches" style="margin:0">${Object.entries(TEAMS).map(([k, t]) => `<button type="button" class="sw" data-pteam="${k}" style="background:${t.fill}" aria-pressed="${o.team === k}" aria-label="${t.name}" title="${t.name}"></button>`).join('')}</div></div>`;
  }
  if (isLine(o) || o.type === 'text') {
    h += `<div class="field"><label>顏色</label><div class="swatches" style="margin:0">${INKS.map(i => `<button type="button" class="sw" data-pink="${i.c}" style="background:${i.c}" aria-pressed="${(o.color || '#141414') === i.c}" aria-label="${i.name}色" title="${i.name}"></button>`).join('')}</div></div>`;
  }
  if (isLine(o) && o.type !== 'zone') {
    h += `<div class="field"><label>路線種類</label><div class="seg">${['run', 'pass', 'dribble'].map(t => `<button type="button" data-ltype="${t}" aria-pressed="${o.type === t}">${LINES[t].name}</button>`).join('')}</div></div>`;
    h += `<div class="field"><div class="row"><button type="button" class="btn small" data-act="straighten">拉直</button><button type="button" class="btn small" data-act="reverse">反轉方向</button></div></div>`;
  }
  if (o.type === 'text') {
    h += sizeField(o.size || 18);
  }
  if (ITEMS[o.type]?.rot) {
    h += `<div class="field"><label>方向（目前 ${((o.rot || 0) % 360 + 360) % 360}°）</label><div class="row"><button type="button" class="btn small" data-rot="-45">向左轉 45°</button><button type="button" class="btn small" data-rot="45">向右轉 45°</button></div></div>`;
  }
  h += `<div class="row"><button type="button" class="btn small" data-act="dup">複製</button><button type="button" class="btn small danger" data-act="del">刪除</button></div>`;
  box.innerHTML = h;
}

export function deleteSel() {
  const objs = selObjs(); if (!objs.length) return;
  mutate(() => { step().items = step().items.filter(x => !objs.includes(x)); clearSel(); });
}

export function dupSel() {
  const objs = selObjs(); if (!objs.length) return;
  mutate(() => {
    const copies = objs.map(o => {
      const c = { ...o, id: uid() };
      shiftObj(c, 30, 24);
      if (c.type === 'player' && objs.length === 1) c.label = nextLabel(step().items, c.team);
      step().items.push(c); return c.id;
    });
    setSelection(copies);
  });
}

export function initProps() {
  hooks.renderProps = renderProps;
  hooks.deleteSel = deleteSel;
  hooks.dupSel = dupSel;
  $('#props').addEventListener('click', e => {
    const b = e.target.closest('button'), objs = selObjs(), o = objs[0]; if (!b || !o) return;
    if (b.dataset.pteam) mutate(() => { objs.filter(x => x.type === 'player').forEach(x => { x.team = b.dataset.pteam; }); });
    else if (b.dataset.pink) mutate(() => { objs.filter(x => isLine(x) || x.type === 'text').forEach(x => { x.color = b.dataset.pink; }); state.ui.ink = b.dataset.pink; hooks.renderTools(); });
    else if (b.dataset.tstep) mutate(() => { objs.filter(x => x.type === 'text').forEach(x => { x.size = clampSize((x.size || 18) + +b.dataset.tstep); }); });
    else if (b.dataset.ltype) mutate(() => { o.type = b.dataset.ltype; });
    else if (b.dataset.rot) mutate(() => { o.rot = ((o.rot || 0) + +b.dataset.rot + 360) % 360; });
    else if (b.dataset.act === 'del') deleteSel();
    else if (b.dataset.act === 'dup') dupSel();
    else if (b.dataset.act === 'straighten') mutate(() => { o.cx = (o.x1 + o.x2) / 2; o.cy = (o.y1 + o.y2) / 2; o.auto = true; });
    else if (b.dataset.act === 'reverse') mutate(() => { [o.x1, o.y1, o.x2, o.y2] = [o.x2, o.y2, o.x1, o.y1]; });
  });
  $('#props').addEventListener('input', e => {
    if (e.target.id === 'propSize' || e.target.id === 'propSizeNum') {
      const v = +e.target.value; if (!v) return;
      const size = clampSize(v);
      textEdit(() => { selObjs().filter(x => x.type === 'text').forEach(x => { x.size = size; }); });
      if (e.target.id === 'propSize') $('#propSizeNum').value = size; else $('#propSize').value = size;
      hooks.renderBoard(); return;
    }
    if (e.target.id !== 'propLabel') return;
    const o = getSel(); if (!o) return;
    textEdit(() => { o.label = e.target.value; }); hooks.renderBoard();
  });
}
