// 範本庫 modal：開關、分類導覽（內建／我的範本＋資料夾）、搜尋篩選工具列、網格渲染（搬自舊版 1248～1555 行，拿掉學校共用分頁）。
import { W, f, uid, esc } from '../core/util.js';
import { COURTS, courtH, courtSVG } from '../core/courts.js';
import { boardContent } from '../core/render.js';
import { TEMPLATES } from '../core/templates.js';
import { allFolders, parseTemplateFile } from '../core/tplfile.js';
import { tplFromDoc } from '../core/doc.js';
import { getMine, getFolders, saveTpl, saveFolders, subscribe } from './library-store.js';
import { libAct, libList, openDoc, errText } from './library-actions.js';
import { $, state } from './state.js';

// 本任務的分類只有 builtin／mine；008 會在這裡加入 'shared'（學校共用），nav 留了一個空容器給它接。
const lib = { view: 'builtin', folder: null, q: '', court: '', grade: '', renaming: null, newFolder: false, renamingFolder: false, lastFolder: '' };

const toast = msg => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2600); };
const ctx = () => ({ lib, getMine, render: renderLib, toast, closeModals: closeAllModals });

function thumb(d) {
  if (!d || !COURTS[d.court] || !d.steps || !d.steps[0]) return '<svg viewBox="0 0 10 6"></svg>';
  return `<svg viewBox="0 0 ${W} ${f(courtH(d.court))}" preserveAspectRatio="xMidYMid meet">${boardContent(d.court, d.steps[0], d.iconScale || 1, false)}</svg>`;
}

function renderLibNav() {
  const mine = getMine(), folders = getFolders();
  const cnt = fn => mine.filter(fn).length;
  const nb = (label, n, attrs, cur, sub) => `<button type="button" class="nav-btn${sub ? ' sub' : ''}" ${attrs} aria-current="${cur}"><span>${label}</span><small>${n}</small></button>`;
  let h = nb('內建範本', TEMPLATES.length, 'data-view="builtin"', lib.view === 'builtin');
  h += `<div class="nav-h">我的範本</div>`;
  h += nb('全部', mine.length, 'data-view="mine" data-folder="*"', lib.view === 'mine' && lib.folder === null);
  for (const fd of allFolders(mine, folders)) h += nb(esc(fd), cnt(t => t.folder === fd), `data-view="mine" data-folder="${esc(fd)}"`, lib.view === 'mine' && lib.folder === fd, true);
  if (cnt(t => !t.folder)) h += nb('未分類', cnt(t => !t.folder), 'data-view="mine" data-folder=""', lib.view === 'mine' && lib.folder === '', true);
  h += lib.newFolder
    ? `<input type="text" id="newFolderIn" class="nav-in" placeholder="資料夾名稱，按 Enter" maxlength="40">`
    : `<button type="button" class="nav-btn add" data-act="newFolder">＋ 新資料夾</button>`;
  h += `<div id="libNavShared"></div>`; // 008：共享區入口加在這裡
  $('#libNav').innerHTML = h;
  const nf = $('#newFolderIn'); if (nf) nf.focus();
}

function renderLibTools() {
  const courtOpts = Object.entries(COURTS).map(([id, c]) => `<option value="${id}"${lib.court === id ? ' selected' : ''}>${c.name}</option>`).join('');
  const grades = ['國小低年級', '國小中年級', '國小高年級', '國中', '高中'].map(g => `<option${lib.grade === g ? ' selected' : ''}>${g}</option>`).join('');
  let h = `<input type="search" id="libQ" placeholder="搜尋範本名稱" value="${esc(lib.q)}" aria-label="搜尋範本">
    <select id="libCourt" aria-label="篩選運動"><option value="">全部運動</option>${courtOpts}</select>
    <select id="libGrade" aria-label="篩選年段"><option value="">全部年段</option>${grades}</select>`;
  if (lib.view === 'mine') {
    if (lib.folder) {
      h += lib.renamingFolder
        ? `<input type="text" id="folderNameIn" value="${esc(lib.folder)}" maxlength="40" aria-label="新的資料夾名稱">`
        : `<button type="button" class="btn small" data-act="renameFolder">重新命名資料夾</button><button type="button" class="btn small danger" data-act="delFolder">刪除資料夾</button>`;
    }
    h += `<button type="button" class="btn small" data-act="import">匯入範本檔</button><button type="button" class="btn small" data-act="exportFile">匯出${lib.folder ? '這個資料夾' : '全部'}</button>`;
  }
  $('#libTools').innerHTML = h;
  const fi = $('#folderNameIn'); if (fi) { fi.focus(); fi.select(); }
  $('#libMsg').textContent = lib.view === 'builtin'
    ? '開啟範本會取代目前的畫面；開錯了按「復原」就能回來。'
    : '我的範本目前只存在這個瀏覽器裡，建議定期匯出範本檔備份。';
}

function renderLibGrid() {
  const mine = getMine();
  const arr = libList(lib, mine);
  const fopts = sel => `<option value=""${!sel ? ' selected' : ''}>未分類</option>` + allFolders(mine, getFolders()).map(fd => `<option value="${esc(fd)}"${sel === fd ? ' selected' : ''}>${esc(fd)}</option>`).join('');
  let h = '';
  if (lib.view === 'builtin' && !lib.q && !lib.court && !lib.grade) {
    h += `<div class="tpl"><button type="button" class="tpl-open" data-open="blank"><svg viewBox="0 0 ${W} ${f(courtH(state.doc.court))}" preserveAspectRatio="xMidYMid meet">${courtSVG(state.doc.court)}</svg><strong>空白教案</strong><span>保留目前的場地，從頭開始畫</span></button></div>`;
  }
  for (const t of arr) {
    const meta = `<em class="chip">${esc(t.grade || '')}</em>${esc(COURTS[t.court]?.name || '')}${t.steps || t.doc?.steps?.length ? `・${t.steps || t.doc.steps.length} 步` : ''}`;
    const name = lib.renaming === t.id
      ? `<input type="text" class="tpl-rename" data-id="${t.id}" value="${esc(t.name)}" maxlength="40" aria-label="範本名稱">`
      : `<strong>${esc(t.name || '未命名')}</strong>`;
    let acts = `<button type="button" data-act="open" data-id="${t.id}">開啟</button>`;
    if (lib.view === 'mine') {
      acts += `<select data-act="move" data-id="${t.id}" aria-label="移到資料夾">${fopts(t.folder || '')}</select>`
        + `<button type="button" data-act="rename" data-id="${t.id}">改名</button><button type="button" data-act="copy" data-id="${t.id}">複製</button>`
        + `<button type="button" class="danger" data-act="del" data-id="${t.id}">刪除</button>`;
    }
    h += `<div class="tpl"><button type="button" class="tpl-open" data-act="open" data-id="${t.id}" title="開啟">${thumb(t.doc)}</button>${name}<span>${meta}</span><div class="tpl-actions">${acts}</div></div>`;
  }
  if (!arr.length && !(lib.view === 'builtin' && h)) {
    h = `<p class="empty lib-empty">${lib.view === 'mine'
      ? (mine.length ? '這裡沒有符合條件的範本。' : '還沒有自己的範本。畫好一份教案後，按上方的「存成範本」，就會出現在這裡。')
      : '沒有符合條件的範本。'}</p>`;
  }
  $('#tplGrid').innerHTML = h;
  const ri = document.querySelector('.tpl-rename'); if (ri) { ri.focus(); ri.select(); }
}

function renderLib() { renderLibNav(); renderLibTools(); renderLibGrid(); }
function refreshLib() { if (!$('#tplModal').hidden) renderLib(); }

function closeAllModals() {
  $('#exportModal').hidden = true; $('#tplModal').hidden = true; $('#saveModal').hidden = true;
  lib.renaming = null; lib.newFolder = false; lib.renamingFolder = false;
}

export function initLibrary() {
  subscribe(refreshLib);
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeAllModals));
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeAllModals(); }));

  $('#btnTemplates').addEventListener('click', () => { renderLib(); $('#tplModal').hidden = false; });

  $('#libNav').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.act) { libAct(b.dataset.act, b, ctx()); return; }
    lib.view = b.dataset.view; lib.folder = b.dataset.folder === undefined || b.dataset.folder === '*' ? null : b.dataset.folder;
    lib.renaming = null; lib.renamingFolder = false; if (lib.folder) lib.lastFolder = lib.folder; renderLib();
  });
  $('#libNav').addEventListener('keydown', async e => {
    if (e.target.id !== 'newFolderIn') return;
    if (e.key === 'Escape') { e.stopPropagation(); lib.newFolder = false; renderLibNav(); return; }
    if (e.key !== 'Enter') return;
    const name = e.target.value.trim(); lib.newFolder = false;
    if (name) { try { await saveFolders([...getFolders(), name]); lib.view = 'mine'; lib.folder = name; lib.lastFolder = name; } catch (err) { toast(errText(err)); } }
    renderLib();
  });
  $('#libNav').addEventListener('focusout', e => { if (e.target.id === 'newFolderIn' && !e.target.value.trim()) { lib.newFolder = false; setTimeout(renderLibNav); } });

  $('#libTools').addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (b) libAct(b.dataset.act, b, ctx()); });
  $('#libTools').addEventListener('input', e => { if (e.target.id === 'libQ') { lib.q = e.target.value; renderLibGrid(); } });
  $('#libTools').addEventListener('change', e => {
    if (e.target.id === 'libCourt') { lib.court = e.target.value; renderLibGrid(); }
    if (e.target.id === 'libGrade') { lib.grade = e.target.value; renderLibGrid(); }
  });
  $('#libTools').addEventListener('keydown', async e => {
    if (e.target.id !== 'folderNameIn') return;
    if (e.key === 'Escape') { e.stopPropagation(); lib.renamingFolder = false; renderLibTools(); return; }
    if (e.key !== 'Enter') return;
    const from = lib.folder, to = e.target.value.trim(); lib.renamingFolder = false;
    if (to && to !== from) {
      try {
        for (const x of getMine().filter(x => x.folder === from)) await saveTpl({ ...x, folder: to });
        await saveFolders(getFolders().map(x => x === from ? to : x).concat(to));
        lib.folder = to; lib.lastFolder = to; toast(`資料夾改名為「${to}」`);
      } catch (err) { toast(errText(err)); }
    }
    renderLib();
  });

  $('#tplGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-act],[data-open]'); if (!b || b.tagName === 'SELECT') return;
    if (b.dataset.open === 'blank') {
      openDoc({ title: '', grade: state.doc.grade, court: state.doc.court, iconScale: state.doc.iconScale || 1, steps: [{ id: uid(), name: '', note: '', items: [] }] });
      closeAllModals(); return;
    }
    libAct(b.dataset.act, b, ctx());
  });
  $('#tplGrid').addEventListener('change', async e => {
    const el = e.target, t = el.dataset.id && getMine().find(x => x.id === el.dataset.id); if (!t) return;
    try {
      if (el.dataset.act === 'move') { await saveTpl({ ...t, folder: el.value }); toast(el.value ? `已移到「${el.value}」` : '已移到「未分類」'); }
      if (el.classList.contains('tpl-rename')) { const n = el.value.trim(); lib.renaming = null; if (n && n !== t.name) await saveTpl({ ...t, name: n }); else renderLibGrid(); }
    } catch (err) { toast(errText(err)); }
  });
  $('#tplGrid').addEventListener('keydown', e => {
    if (!e.target.classList.contains('tpl-rename')) return;
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') { e.stopPropagation(); lib.renaming = null; renderLibGrid(); }
  });

  $('#importFile').addEventListener('change', async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    try {
      const list = parseTemplateFile(await file.text());
      if (!list.length) { toast('這個檔案裡找不到範本。'); return; }
      const newFolders = [];
      for (const x of list) {
        if (x.folder) newFolders.push(x.folder);
        await saveTpl({ ...tplFromDoc(x.doc, { name: x.name }), id: 't' + uid(), folder: x.folder });
      }
      if (newFolders.length) await saveFolders([...getFolders(), ...newFolders]);
      toast(`已匯入 ${list.length} 個範本`);
    } catch (err) { toast('讀不懂這個檔案，請選擇從這裡匯出的 .json 範本檔。'); }
  });
}
