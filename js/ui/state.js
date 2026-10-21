// 唯一的可變狀態：教案 doc、介面狀態 ui、拖曳 drag、動畫 anim，以及復原／重做與選取（搬自舊版 State 段）。
// UI 模組彼此不 import；需要呼叫別的模組時，透過 hooks（由各模組 init 時填入）。
import { createHistory } from '../core/history.js';
import { saveDoc } from '../store/local.js';

export const $ = s => document.querySelector(s);

export const state = {
  doc: null,
  ui: { tool: 'select', team: 'red', ink: '#141414', sel: null, sels: [] },
  drag: null,
  anim: null,
};
export const history = createHistory({ limit: 80 });

const noop = () => {};
export const hooks = {
  renderBoard: noop, renderSteps: noop, renderProps: noop, renderHint: noop, renderTools: noop,
  syncInputs: noop, stopAnim: noop,
  // 011 新增：keyboard.js 透過這三個掛勾呼叫 toolbar.js／props.js，不直接互相 import。
  setTool: noop, deleteSel: noop, dupSel: noop,
};

export const step = () => state.doc.steps[state.doc.cur];
export const findObj = id => step().items.find(o => o.id === id);
// ui.sel 是單選（顯示把手與完整屬性）；ui.sels 是多選。
export const getSel = () => state.ui.sel ? findObj(state.ui.sel) : null;
export const selIds = () => state.ui.sels.length ? state.ui.sels : state.ui.sel ? [state.ui.sel] : [];
export const selObjs = () => selIds().map(findObj).filter(Boolean);
export function setSelection(ids) {
  const ui = state.ui;
  ids = [...new Set(ids)];
  if (ids.length === 1) { ui.sel = ids[0]; ui.sels = []; } else { ui.sel = null; ui.sels = ids; }
}
export const selectOne = id => setSelection([id]);
export function clearSel() { state.ui.sel = null; state.ui.sels = []; }

export function save() { saveDoc(state.doc); }
export function updateHistory() { $('#btnUndo').disabled = !history.canUndo(); $('#btnRedo').disabled = !history.canRedo(); }
export function pushUndo() { history.push(JSON.stringify(state.doc)); updateHistory(); }
export function restore(json) {
  const ui = state.ui;
  state.doc = JSON.parse(json); state.doc.cur = Math.min(state.doc.cur, state.doc.steps.length - 1);
  ui.sels = ui.sels.filter(findObj); if (ui.sel && !findObj(ui.sel)) clearSel();
  hooks.syncInputs(); renderAll(); save();
}
export function doUndo() { const json = history.undo(JSON.stringify(state.doc)); if (json !== null) restore(json); }
export function doRedo() { const json = history.redo(JSON.stringify(state.doc)); if (json !== null) restore(json); }
export function mutate(fn) { hooks.stopAnim(); pushUndo(); fn(); renderAll(); save(); }

// 打字類的編輯：同一次聚焦只記一筆復原（focusin 時重設）。
let typingUndo = false;
export function textEdit(fn) { if (!typingUndo) { pushUndo(); typingUndo = true; } fn(); save(); }

export function renderAll() { hooks.renderBoard(); hooks.renderSteps(); hooks.renderProps(); hooks.renderHint(); updateHistory(); }

export function initState(doc) {
  state.doc = doc;
  document.addEventListener('focusin', e => { if (e.target.matches('input,textarea')) typingUndo = false; });
}
