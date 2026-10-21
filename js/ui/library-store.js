// 範本庫「我的範本」與「資料夾」的讀寫介面：本機（localStorage）與雲端（Firestore，登入後）。
// onUser 登入時切換到雲端並做首次上傳；登出切回本機。本機資料不刪（008）。
import { loadLib, saveLib } from '../store/local.js';
import { onUser } from '../store/firebase.js';
import { listMine, saveMine, deleteMine, saveFolders as cloudSaveFolders } from '../store/cloud.js';
import { planFirstUpload, planFolderMerge } from '../core/share.js';

let mine = [], folders = [];
({ mine, folders } = loadLib());
let mode = 'local', uid = null;
let toastFn = null;

const subscribers = new Set();
function notify() { for (const fn of subscribers) fn({ mine, folders }); }
function persist() { saveLib({ mine, folders }); notify(); }
const fail = code => { const e = new Error(code); e.code = code; return e; };
const checked = r => { if (r.offline) throw fail('offline'); if (r.error) throw fail(r.error); return r; };

export const getMine = () => mine;
export const getFolders = () => folders;
export const isCloud = () => mode === 'cloud';
// library.js 的 toast() 由此註冊，讓同步完成／失敗時能通知使用者。
export function setToast(fn) { toastFn = fn; }

// fn({ mine, folders }) 會在資料變動時呼叫（本機版本是同步的；雲端版本是非同步寫入後呼叫）。
// 回傳取消訂閱的函式。
export function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

async function migrateIfNeeded(u) {
  const flagKey = `pe-board-migrated-${u.uid}`;
  const local = loadLib();
  const r = checked(await listMine(u.uid));
  let cloudMine = r.mine, cloudFolders = r.folders;
  if (!localStorage.getItem(flagKey)) {
    const toUpload = planFirstUpload(local.mine, cloudMine);
    for (const t of toUpload) checked(await saveMine(u.uid, t));
    if (toUpload.length) cloudMine = [...cloudMine, ...toUpload];
    const { merged, changed } = planFolderMerge(local.folders, cloudFolders);
    if (changed) { const fr = checked(await cloudSaveFolders(u.uid, merged)); cloudFolders = fr.folders; }
    else cloudFolders = merged;
    try { localStorage.setItem(flagKey, '1'); } catch (e) {}
    if (toUpload.length) toastFn?.(`已將 ${toUpload.length} 個本機範本同步到你的 Google 帳號`);
  }
  mine = cloudMine; folders = cloudFolders;
}

async function switchToCloud(u) {
  uid = u.uid;
  try { await migrateIfNeeded(u); mode = 'cloud'; notify(); }
  catch (e) { toastFn?.('暫時連不到雲端，先用這個瀏覽器的本機範本。'); }
}

function switchToLocal() {
  mode = 'local'; uid = null;
  ({ mine, folders } = loadLib());
  notify();
}

onUser(u => { if (u) switchToCloud(u); else switchToLocal(); });

export async function saveTpl(t) {
  t = { ...t, kind: 'tpl', updatedAt: Date.now() };
  if (mode === 'cloud') {
    checked(await saveMine(uid, t));
    const i = mine.findIndex(x => x.id === t.id); if (i >= 0) mine[i] = t; else mine.push(t);
    notify();
    return t;
  }
  const i = mine.findIndex(x => x.id === t.id);
  if (i >= 0) mine[i] = t; else mine.push(t);
  persist();
  return t;
}

export async function deleteTpl(id) {
  if (mode === 'cloud') {
    checked(await deleteMine(uid, id));
    mine = mine.filter(t => t.id !== id);
    notify();
    return;
  }
  mine = mine.filter(t => t.id !== id);
  persist();
}

export async function saveFolders(list) {
  const next = [...new Set(list.filter(Boolean))];
  if (mode === 'cloud') {
    const removed = folders.filter(f => !next.includes(f));
    const r = checked(await cloudSaveFolders(uid, next, removed));
    folders = r.folders;
    notify();
    return;
  }
  folders = next;
  persist();
}
