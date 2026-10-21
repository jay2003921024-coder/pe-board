// 鍵盤快捷鍵（搬自舊版 1038～1060）。只 import state.js／core，透過 hooks 呼叫 toolbar.js、props.js。
import { clampSize } from '../core/items.js';
import { shiftObj } from '../core/doc.js';
import { state, hooks, step, selObjs, selIds, setSelection, clearSel, doUndo, doRedo, pushUndo, mutate, save } from './state.js';

// 與 toolbar.js 的 KEYS 重複一份：keyboard.js 只 import state.js／core，不 import 其他 UI 模組。
const KEYS = { v: 'select', s: 'player', t: 'teacher', c: 'cone', b: 'ball', x: 'text', r: 'run', p: 'pass', d: 'dribble', z: 'zone' };

function closeModals() {
  for (const m of document.querySelectorAll('.modal')) m.hidden = true;
}

function onKeyDown(e) {
  if (e.target.matches && e.target.matches('input:not([type=range]),textarea,select')) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
  if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); hooks.dupSel(); return; }
  if (e.key === 'Escape') {
    const openModal = [...document.querySelectorAll('.modal')].some(m => !m.hidden);
    if (openModal) { closeModals(); return; }
    clearSel(); hooks.setTool('select'); hooks.renderProps(); return;
  }
  if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); hooks.setTool('select'); setSelection(step().items.map(o => o.id)); hooks.renderBoard(); hooks.renderProps(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { if (selIds().length) { e.preventDefault(); hooks.deleteSel(); } return; }
  if (!mod && !e.altKey && KEYS[e.key.toLowerCase()]) { hooks.setTool(KEYS[e.key.toLowerCase()]); return; }
  const texts = selObjs().filter(x => x.type === 'text');
  if (!mod && (e.key === '[' || e.key === ']') && texts.length) {
    e.preventDefault(); mutate(() => texts.forEach(x => { x.size = clampSize((x.size || 18) + (e.key === ']' ? 2 : -2)); })); return;
  }
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const objs = selObjs();
  if (arrows[e.key] && objs.length) {
    e.preventDefault(); const [dx, dy] = arrows[e.key].map(v => v * (e.shiftKey ? 10 : 2));
    if (!e.repeat) pushUndo();
    objs.forEach(o => shiftObj(o, dx, dy));
    hooks.renderBoard(); save();
  }
}

export function initKeyboard() {
  document.addEventListener('keydown', onKeyDown);
}
