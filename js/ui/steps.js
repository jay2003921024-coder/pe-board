// 步驟分頁、本步驟名稱與說明、教案資訊欄位、場地選單與切換。
import { uid, esc } from '../core/util.js';
import { COURTS, courtH } from '../core/courts.js';
import { isLine } from '../core/items.js';
import { $, state, hooks, step, clearSel, mutate, textEdit, renderAll, save } from './state.js';

export function renderSteps() {
  const doc = state.doc;
  $('#steps').innerHTML = doc.steps.map((s, i) => `<button type="button" class="step-tab" role="tab" data-step="${i}" aria-current="${i === doc.cur}"><b>${i + 1}</b>${esc(s.name || '未命名')}</button>`).join('')
    + `<button type="button" class="step-add" id="btnAddStep" title="複製目前的人和器材位置，開始下一步">＋ 下一步</button>`;
  $('#stepCount').textContent = `第 ${doc.cur + 1} / ${doc.steps.length} 步`;
  $('#btnDelStep').disabled = doc.steps.length < 2;
  const pb = $('#btnPlay');
  pb.disabled = doc.steps.length < 2 && !state.anim;
  pb.title = doc.steps.length < 2 ? '至少要有兩個步驟才能播放' : '從目前步驟開始，依序播放人和球的移動';
}

export function syncInputs() {
  const doc = state.doc;
  $('#lessonTitle').value = doc.title || '';
  $('#grade').value = doc.grade || '國中';
  $('#court').value = doc.court;
  $('#infoPlayers').value = doc.players || '';
  $('#infoEquip').value = doc.equipment || '';
  $('#infoTime').value = doc.duration || '';
  $('#iconScale').value = doc.iconScale || 1;
  $('#iconScaleVal').textContent = `${Math.round((doc.iconScale || 1) * 100)}%`;
  $('#stepName').value = step().name || '';
  $('#stepNote').value = step().note || '';
}

function fillCourtSelect() {
  const groups = {};
  for (const [id, c] of Object.entries(COURTS)) (groups[c.group] ||= []).push(`<option value="${id}">${c.name}</option>`);
  $('#court').innerHTML = Object.entries(groups).map(([gname, opts]) => `<optgroup label="${gname}">${opts.join('')}</optgroup>`).join('');
}

export function initSteps() {
  hooks.renderSteps = renderSteps;
  hooks.syncInputs = syncInputs;
  fillCourtSelect();
  const doc = () => state.doc;
  $('#lessonTitle').addEventListener('input', e => textEdit(() => { doc().title = e.target.value; }));
  $('#infoPlayers').addEventListener('input', e => textEdit(() => { doc().players = e.target.value; }));
  $('#infoEquip').addEventListener('input', e => textEdit(() => { doc().equipment = e.target.value; }));
  $('#infoTime').addEventListener('input', e => textEdit(() => { doc().duration = e.target.value; }));
  $('#stepName').addEventListener('input', e => { textEdit(() => { step().name = e.target.value; }); renderSteps(); });
  $('#stepNote').addEventListener('input', e => textEdit(() => { step().note = e.target.value; }));
  $('#grade').addEventListener('change', e => mutate(() => { doc().grade = e.target.value; }));
  $('#iconScale').addEventListener('input', e => { textEdit(() => { doc().iconScale = +e.target.value; }); $('#iconScaleVal').textContent = `${Math.round(doc().iconScale * 100)}%`; hooks.renderBoard(); });
  $('#court').addEventListener('change', e => mutate(() => {
    const d = doc();
    d.court = e.target.value; const H = courtH(d.court);
    state.view = null; // 換場地後比例不同，取消目前的縮放／平移
    for (const s of d.steps) for (const o of s.items) {
      if (isLine(o)) { o.y1 = Math.min(o.y1, H); o.y2 = Math.min(o.y2, H); o.cy = Math.min(o.cy, H); }
      else o.y = Math.min(o.y, H - 10);
    }
    hooks.renderTools();
  }));
  $('#steps').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'btnAddStep') {
      mutate(() => {
        // 保留物件 id，動畫才知道下一步的哪個物件是同一個。
        const d = doc(), items = step().items.filter(o => !isLine(o) || o.type === 'zone').map(o => ({ ...o }));
        d.steps.splice(d.cur + 1, 0, { id: uid(), name: '', note: '', items }); d.cur++; clearSel();
      });
      syncInputs(); $('#stepName').focus(); return;
    }
    if (b.dataset.step) { hooks.stopAnim(); doc().cur = +b.dataset.step; clearSel(); syncInputs(); renderAll(); save(); }
  });
  $('#btnDelStep').addEventListener('click', () => {
    const d = doc(); if (d.steps.length < 2) return;
    mutate(() => { d.steps.splice(d.cur, 1); d.cur = Math.max(0, d.cur - 1); clearSel(); }); syncInputs();
  });
  $('#btnClearStep').addEventListener('click', () => mutate(() => { step().items = []; clearSel(); }));
}
