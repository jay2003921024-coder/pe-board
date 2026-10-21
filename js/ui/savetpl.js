// 存成範本 modal：另存新範本或更新已開啟的範本（搬自舊版 1558～1593 行）。
import { uid, esc } from '../core/util.js';
import { tplFromDoc } from '../core/doc.js';
import { allFolders } from '../core/tplfile.js';
import { getMine, getFolders, saveTpl, saveFolders, subscribe, isCloud } from './library-store.js';
import { $, state, hooks, save } from './state.js';

let saveMode = 'new', lastFolder = '';

function fillSaveFolders() {
  const sel = $('#saveFolder'), cur = sel.value;
  sel.innerHTML = `<option value="">未分類</option>` + allFolders(getMine(), getFolders()).map(fd => `<option value="${esc(fd)}">${esc(fd)}</option>`).join('') + `<option value="__new">＋ 新資料夾…</option>`;
  sel.value = [...sel.options].some(o => o.value === cur) ? cur : '';
}

function setSaveMode(m) { saveMode = m; document.querySelectorAll('#saveModeField [data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); }

export function initSaveTpl() {
  subscribe(() => { if (!$('#saveModal').hidden) fillSaveFolders(); });

  $('#btnSaveTpl').addEventListener('click', () => {
    hooks.stopAnim();
    const doc = state.doc;
    const src = doc.srcTpl && getMine().find(t => t.id === doc.srcTpl);
    $('#saveName').value = src ? src.name : (doc.title || '');
    fillSaveFolders(); $('#saveFolder').value = src ? (src.folder || '') : lastFolder;
    if (![...$('#saveFolder').options].some(o => o.value === $('#saveFolder').value)) $('#saveFolder').value = '';
    $('#newFolderField').hidden = true; $('#saveNewFolder').value = '';
    $('#saveModeField').hidden = !src; if (src) $('#saveModeName').textContent = src.name;
    setSaveMode(src ? 'update' : 'new');
    $('#saveMsg').textContent = isCloud() ? '範本會存在你的 Google 帳號。' : '範本會存在這個瀏覽器裡。';
    $('#saveAlsoPublish').checked = false;
    $('#saveModal').hidden = false; $('#saveName').focus(); $('#saveName').select();
  });
  $('#saveFolder').addEventListener('change', e => { $('#newFolderField').hidden = e.target.value !== '__new'; if (e.target.value === '__new') $('#saveNewFolder').focus(); });
  $('#saveModeField').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) setSaveMode(b.dataset.mode); });
  $('#saveModal').addEventListener('submit', async e => {
    e.preventDefault();
    const doc = state.doc;
    const name = $('#saveName').value.trim() || doc.title || '未命名教案';
    let folder = $('#saveFolder').value;
    if (folder === '__new') { folder = $('#saveNewFolder').value.trim(); if (!folder) { $('#saveNewFolder').focus(); return; } }
    const btn = $('#btnDoSave'); btn.disabled = true; $('#saveMsg').textContent = '儲存中…';
    try {
      if (folder && !allFolders(getMine(), getFolders()).includes(folder)) await saveFolders([...getFolders(), folder]);
      const id = saveMode === 'update' && doc.srcTpl ? doc.srcTpl : 't' + uid();
      await saveTpl({ ...tplFromDoc(doc, { name }), id, folder });
      doc.srcTpl = id; save(); lastFolder = folder;
      $('#saveModal').hidden = true; $('#saveMsg').textContent = '';
      if ($('#saveAlsoPublish').checked) hooks.startPublish({ kind: 'mine', tplId: id });
    } catch (err) { $('#saveMsg').textContent = err && err.code === 'quota_exceeded' ? '範本空間已滿，請先刪除一些不用的範本。' : '沒有存成功，請稍後再試一次。'; }
    finally { btn.disabled = false; }
  });
}
