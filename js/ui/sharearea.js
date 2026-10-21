// 範本庫「共享區」分頁：瀏覽／搜尋／套用共享範本，發布入口（startPublish），
// 作者修改／刪除自己的、管理員下架，空狀態與離線提示（AC-19、20、22～24、26、27、29）。
// 搬自 008 任務提示；不直接 import 其他 UI 模組，透過 library.js 的 shareHooks 與 state.js 的 hooks 接上。
import { W, f, esc } from '../core/util.js';
import { COURTS, courtH } from '../core/courts.js';
import { boardContent } from '../core/render.js';
import { filterShared } from '../core/share.js';
import { tplFromDoc } from '../core/doc.js';
import { currentUser, onResume } from '../store/firebase.js';
import { listShared, publish, updateShared, deleteShared } from '../store/cloud.js';
import { getMine, saveTpl } from './library-store.js';
import { armDanger, openDoc } from './library-actions.js';
import { openSharedTab, shareHooks } from './library.js';
import { hooks, state } from './state.js';

const shared = { items: [], cursor: null, more: false, status: 'idle', fetchedCourt: undefined, loadingMore: false };
let pendingSource = null, pendingTpl = null, pendingUser = null;

function thumb(d) {
  if (!d || !COURTS[d.court] || !d.steps || !d.steps[0]) return '<svg viewBox="0 0 10 6"></svg>';
  return `<svg viewBox="0 0 ${W} ${f(courtH(d.court))}" preserveAspectRatio="xMidYMid meet">${boardContent(d.court, d.steps[0], d.iconScale || 1, false)}</svg>`;
}
const fmtTime = ms => { if (!ms) return ''; const d = new Date(ms); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };

async function fetchPage(court, after) {
  const r = await listShared({ court, after });
  if (r.offline) { shared.status = 'offline'; return; }
  if (r.error) { shared.status = 'error'; return; }
  shared.status = 'ready';
  shared.items = after ? [...shared.items, ...r.items] : r.items;
  shared.cursor = r.cursor; shared.more = r.more;
}

function ensureFetched(ctx) {
  if (shared.status !== 'idle' && shared.fetchedCourt === ctx.lib.court) return;
  shared.status = 'loading'; shared.fetchedCourt = ctx.lib.court; shared.items = []; shared.cursor = null; shared.more = false;
  fetchPage(ctx.lib.court, null).then(() => ctx.render());
}

function renderNav(lib) {
  return `<div class="nav-h">共享區</div><button type="button" class="nav-btn" data-view="shared" aria-current="${lib.view === 'shared'}"><span>共享區</span></button>`;
}

function open(ctx) {
  ctx.lib.q = ''; ctx.lib.court = ''; shared.status = 'idle'; shared.fetchedCourt = undefined;
  ensureFetched(ctx);
}

function renderTools(ctx) {
  const { lib } = ctx;
  const courtOpts = Object.entries(COURTS).map(([id, c]) => `<option value="${id}"${lib.court === id ? ' selected' : ''}>${c.name}</option>`).join('');
  document.querySelector('#libTools').innerHTML = `
    <button type="button" class="btn small primary" data-act="publishCurrent">發布目前教案</button>
    <input type="search" id="libQ" placeholder="搜尋範本名稱" value="${esc(lib.q)}" aria-label="搜尋範本">
    <select id="libCourt" aria-label="篩選運動"><option value="">全部運動</option>${courtOpts}</select>
    ${shared.status === 'offline' || shared.status === 'error' ? '<button type="button" class="btn small" data-act="retry">重新整理</button>' : ''}`;
  document.querySelector('#libMsg').textContent = shared.status === 'offline' ? '暫時連不到共享區，其他功能不受影響，稍後可以按「重新整理」再試一次。'
    : shared.status === 'error' ? '共享區發生問題，請稍後再試。'
    : '這裡是所有老師發布的範本，任何人都能瀏覽與套用，不需要登入。';
}

function emptyState(ctx) {
  return `<div class="shared-empty">
    <p class="empty">共享區還沒有任何老師發布範本。發布後，其他老師打開共享區就看得到你的教案。</p>
    <div class="row">
      <button type="button" class="btn small" data-act="viewBuiltin">看內建範本</button>
      <button type="button" class="btn small primary" data-act="publishCurrent">發布第一個範本</button>
    </div>
  </div>`;
}

function renderGrid(ctx) {
  ensureFetched(ctx);
  const grid = document.querySelector('#tplGrid');
  if (shared.status === 'loading' || shared.status === 'idle') { grid.innerHTML = `<p class="empty">載入中…</p>`; return; }
  if (shared.status === 'offline') { grid.innerHTML = `<p class="empty">暫時連不到共享區。</p>`; return; }
  if (shared.status === 'error') { grid.innerHTML = `<p class="empty">共享區發生問題，請稍後再試。</p>`; return; }
  const arr = filterShared(shared.items, { q: ctx.lib.q, court: '' }); // court 篩選已在 listShared 做過
  if (!shared.items.length) { grid.innerHTML = emptyState(ctx); return; }
  if (!arr.length) { grid.innerHTML = `<p class="empty lib-empty">沒有符合條件的範本。</p>`; return; }
  const me = currentUser();
  let h = '';
  for (const t of arr) {
    const mine = me && t.authorUid === me.uid;
    const meta = `${esc(COURTS[t.court]?.name || '')}${t.steps ? `・${t.steps} 步` : ''}`;
    let acts = `<button type="button" data-act="open" data-id="${t.id}">開啟</button><button type="button" data-act="save" data-id="${t.id}">存到我的範本</button>`;
    if (mine) acts += `<button type="button" data-act="update" data-id="${t.id}">更新為目前教案</button><button type="button" class="danger" data-act="del" data-id="${t.id}">刪除</button>`;
    if (me?.isAdmin) acts += `<button type="button" class="danger" data-act="takedown" data-id="${t.id}">下架</button>`;
    h += `<div class="tpl"><button type="button" class="tpl-open" data-act="open" data-id="${t.id}" title="開啟">${thumb(t.doc)}</button>
      <strong>${esc(t.name || '未命名')}</strong><span>${meta}</span>
      <span class="by">${esc(t.authorName)}・${fmtTime(t.updatedAt || t.createdAt)}</span>
      <div class="tpl-actions">${acts}</div></div>`;
  }
  if (shared.more) h += `<div class="tpl tpl-more"><button type="button" class="btn small" data-act="loadMore">載入更多</button></div>`;
  grid.innerHTML = h;
}

async function act(action, b, ctx) {
  const { toast, render, closeModals } = ctx;
  const t = b.dataset.id ? shared.items.find(x => x.id === b.dataset.id) : null;
  try {
    if (action === 'publishCurrent') { startPublish({ kind: 'current' }); }
    else if (action === 'viewBuiltin') { ctx.lib.view = 'builtin'; render(); }
    else if (action === 'retry') { shared.status = 'idle'; ensureFetched(ctx); render(); }
    else if (action === 'loadMore' && shared.more && !shared.loadingMore) {
      shared.loadingMore = true;
      await fetchPage(ctx.lib.court, shared.cursor);
      shared.loadingMore = false; render();
    } else if (action === 'open' && t) { openDoc(t.doc); closeModals(); }
    else if (action === 'save' && t) {
      const id = 't' + Math.random().toString(36).slice(2, 10);
      await saveTpl({ ...tplFromDoc(t.doc, { name: t.name }), id });
      toast('已存到我的範本');
    } else if (action === 'update' && t && currentUser()?.uid === t.authorUid) {
      armDanger(b, '確定更新？', async () => {
        const r = await updateShared(t.id, tplFromDoc(state.doc, { name: t.name }));
        if (r.offline || r.error) { toast('目前連不到共享區，請稍後再試。'); return; }
        toast('已更新共享範本'); shared.status = 'idle'; ensureFetched(ctx); render();
      });
    } else if (action === 'del' && t && currentUser()?.uid === t.authorUid) {
      armDanger(b, '確定刪除？', async () => {
        const r = await deleteShared(t.id);
        if (r.offline || r.error) { toast('目前連不到共享區，請稍後再試。'); return; }
        toast(`已刪除「${t.name}」`); shared.status = 'idle'; ensureFetched(ctx); render();
      });
    } else if (action === 'takedown' && t && currentUser()?.isAdmin) {
      armDanger(b, '確定下架？', async () => {
        const r = await deleteShared(t.id);
        if (r.offline || r.error) { toast('目前連不到共享區，請稍後再試。'); return; }
        toast(`已下架「${t.name}」`); shared.status = 'idle'; ensureFetched(ctx); render();
      });
    }
  } catch (e) { toast('發生問題，請稍後再試一次。'); }
}

function tplForSource(source) {
  if (source.kind === 'current') return tplFromDoc(state.doc);
  if (source.kind === 'mine') return getMine().find(t => t.id === source.tplId) || null;
  return null;
}

function openPublishConfirm(source, user) {
  const tpl = tplForSource(source);
  if (!tpl) return;
  pendingSource = source; pendingTpl = tpl; pendingUser = user;
  const nameEl = document.querySelector('#publishName');
  nameEl.value = tpl.name || tpl.doc?.title || '未命名教案';
  document.querySelector('#publishMsg').textContent = `發布後，範本會公開給所有人瀏覽，並顯示你的 Google 名稱「${user.name}」。`;
  document.querySelector('#publishModal').hidden = false; nameEl.focus(); nameEl.select();
}

export async function startPublish(source) {
  const user = currentUser();
  if (!user) {
    const r = await hooks.promptLogin(source);
    if (!r) return;
    openPublishConfirm(source, r.user);
    return;
  }
  openPublishConfirm(source, user);
}

export function initSharearea() {
  Object.assign(shareHooks, { renderNav, open, renderTools, renderGrid, act });
  hooks.startPublish = startPublish;
  onResume(intent => { openSharedTab(); startPublish(intent); });

  document.querySelector('#publishModal [data-close]').addEventListener('click', () => { document.querySelector('#publishModal').hidden = true; pendingTpl = null; });
  document.querySelector('#publishModal').addEventListener('submit', async e => {
    e.preventDefault();
    if (!pendingTpl) return;
    const name = document.querySelector('#publishName').value.trim() || pendingTpl.name;
    const btn = document.querySelector('#btnDoPublish'); btn.disabled = true;
    document.querySelector('#publishMsg').textContent = '發布中…';
    const r = await publish({ ...pendingTpl, name }, pendingUser);
    btn.disabled = false;
    if (r.offline || r.error) { document.querySelector('#publishMsg').textContent = '目前連不到共享區，請檢查網路後再試一次。'; return; }
    document.querySelector('#publishModal').hidden = true;
    const t = document.querySelector('#toast'); t.textContent = '已發布到共享區'; t.hidden = false; clearTimeout(t.h); t.h = setTimeout(() => { t.hidden = true; }, 2600);
    pendingTpl = null; pendingSource = null;
    shared.status = 'idle';
  });
}
