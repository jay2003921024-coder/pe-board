// 範本庫的操作邏輯：開啟、改名、複製、刪除、資料夾、匯出檔案（搬自舊版 libAct／exportTemplates，拿掉 window.claude／share／unshare）。
import { uid } from '../core/util.js';
import { normalizeDoc } from '../core/doc.js';
import { TEMPLATES, docFromTemplate } from '../core/templates.js';
import { serializeTemplates } from '../core/tplfile.js';
import { saveTpl, deleteTpl, saveFolders, getFolders } from './library-store.js';
import { $, state, hooks, clearSel, pushUndo, save, renderAll } from './state.js';

export const errText = e => e && e.code === 'quota_exceeded' ? '範本空間已滿，請先刪除一些不用的範本。'
  : e && e.code === 'offline' ? '目前連不到雲端，請檢查網路後再試一次。'
  : '沒有存成功，請稍後再試一次。';

let builtinDocs = null;
export const getBuiltinDocs = () => builtinDocs ||= TEMPLATES.map(docFromTemplate);

export function libList(lib, mine) {
  let arr;
  if (lib.view === 'builtin') arr = TEMPLATES.map((t, i) => ({ id: 'b' + i, builtin: i, name: t.title, grade: t.grade, court: t.court, doc: getBuiltinDocs()[i] }));
  else arr = mine.filter(t => lib.folder === null || (t.folder || '') === lib.folder);
  const q = lib.q.trim().toLowerCase();
  arr = arr.filter(t => (!q || (t.name || '').toLowerCase().includes(q) || (t.folder || '').toLowerCase().includes(q)) && (!lib.court || t.court === lib.court) && (!lib.grade || t.grade === lib.grade));
  if (lib.view !== 'builtin') arr = [...arr].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return arr;
}
export const findLibItem = (id, lib, mine) => libList(lib, mine).find(t => t.id === id) || mine.find(t => t.id === id);

export function openDoc(d, srcTpl) {
  hooks.stopAnim(); pushUndo();
  state.doc = normalizeDoc(d);
  if (srcTpl) state.doc.srcTpl = srcTpl;
  clearSel(); hooks.syncInputs(); hooks.renderTools(); renderAll(); save();
}

export function armDanger(b, label, fn) {
  if (b.dataset.armed) { fn(); return; }
  const old = b.textContent; b.dataset.armed = '1'; b.textContent = label;
  setTimeout(() => { if (b.isConnected) { b.textContent = old; delete b.dataset.armed; } }, 3000);
}

// list 已是 { id, kind, name, court, grade, steps, doc, folder, updatedAt }[]；回傳匯出的數量。
export function exportTemplates(list) {
  const data = serializeTemplates(list);
  const filename = `體育教案範本-${list.folderLabel || '全部'}.json`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return list.length;
}

// ctx = { lib, getMine, render, toast, closeModals }
export async function libAct(act, b, ctx) {
  const { lib, getMine, render, toast, closeModals } = ctx;
  const mine = getMine();
  const t = b.dataset.id ? findLibItem(b.dataset.id, lib, mine) : null;
  try {
    if (act === 'open' && t) { openDoc(t.builtin !== undefined ? docFromTemplate(TEMPLATES[t.builtin]) : t.doc, lib.view === 'mine' ? t.id : null); closeModals(); }
    else if (act === 'rename' && t) { lib.renaming = t.id; render(); }
    else if (act === 'copy' && t) { await saveTpl({ ...t, id: 't' + uid(), name: `${t.name}（副本）` }); toast('已複製範本'); render(); }
    else if (act === 'del' && t) armDanger(b, '確定刪除？', async () => { await deleteTpl(t.id); toast(`已刪除「${t.name}」`); render(); });
    else if (act === 'newFolder') { lib.newFolder = true; render(); }
    else if (act === 'renameFolder') { lib.renamingFolder = true; render(); }
    else if (act === 'delFolder') armDanger(b, '確定刪除？裡面的範本會移到「未分類」', async () => {
      const name = lib.folder;
      for (const x of mine.filter(x => x.folder === name)) await saveTpl({ ...x, folder: '' });
      await saveFolders(getFolders().filter(x => x !== name));
      lib.folder = null; toast(`已刪除資料夾「${name}」`); render();
    });
    else if (act === 'import') $('#importFile').click();
    else if (act === 'exportFile') {
      const list = mine.filter(x => lib.folder === null || (x.folder || '') === lib.folder);
      if (!list.length) { toast('這裡還沒有範本可以匯出'); return; }
      list.folderLabel = lib.folder;
      try { const n = exportTemplates(list); toast(`已匯出 ${n} 個範本`); } catch (e) { toast('這裡沒辦法下載檔案。'); }
    }
  } catch (e) { toast(errText(e)); }
}
