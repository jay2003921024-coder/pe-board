// 共享區與雲端「我的範本」的純邏輯：Firestore 紀錄的建立/讀回、搜尋篩選、首次登入上傳計畫、資料夾合併、管理員判斷、錯誤分類。
// 不碰 Firebase：時間戳記只以 duck typing（有 toMillis 就用）讀取。
import { uid } from './util.js';
import { normalizeDoc } from './doc.js';

export const NAME_MAX = 40;
export const DOC_JSON_MAX = 300000; // 字元數；firestore.rules 內同一個數字，由 config.test.js 檢查一致
export const AUTHOR_MAX = 100;
export const PAGE_SIZE = 50;

const toMillis = v => typeof v?.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : 0;
const cleanName = s => String(s ?? '').trim().slice(0, NAME_MAX) || '未命名教案';

class ShareError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// 範本 → 雲端存的內容欄位（不含作者、時間戳記）。docJson 超過上限時 throw（code 'too-large'）。
export function sharedContent(tpl) {
  const doc = normalizeDoc(tpl?.doc);
  const docJson = JSON.stringify(doc);
  if (docJson.length > DOC_JSON_MAX) throw new ShareError('too-large', '教案內容太大，無法上傳');
  return { name: cleanName(tpl?.name || doc.title), court: doc.court, grade: doc.grade, steps: doc.steps.length, docJson };
}

// 發布用紀錄（不含 createdAt/updatedAt，由存取層補 serverTimestamp）。
export function toSharedRecord(tpl, user) {
  return { ...sharedContent(tpl), authorUid: user.uid, authorName: String(user.name || '').trim().slice(0, AUTHOR_MAX) || '老師' };
}

// 解析 docJson；不是 JSON 或不是物件時回 null，否則正規化。
function parseDocJson(s) {
  if (typeof s !== 'string') return null;
  try { const d = JSON.parse(s); return d && typeof d === 'object' && !Array.isArray(d) ? normalizeDoc(d) : null; } catch (e) { return null; }
}

// Firestore 讀回的 { id, ...data } → 共享區項目；壞資料回 null。
export function fromSharedRecord(rec) {
  if (!rec || typeof rec.id !== 'string' || typeof rec.name !== 'string') return null;
  const doc = parseDocJson(rec.docJson);
  if (!doc) return null;
  return {
    id: rec.id, name: cleanName(rec.name), court: doc.court, grade: doc.grade, steps: doc.steps.length, doc,
    authorUid: String(rec.authorUid || ''), authorName: String(rec.authorName || '') || '老師',
    createdAt: toMillis(rec.createdAt), updatedAt: toMillis(rec.updatedAt),
  };
}

// 本機範本 → users/{uid}/templates/{id} 的欄位。
export function toMineRecord(tpl) {
  const { docJson, ...c } = sharedContent(tpl);
  return { ...c, folder: typeof tpl.folder === 'string' ? tpl.folder.slice(0, NAME_MAX) : '', updatedAt: +tpl.updatedAt || 0, docJson };
}

// users/{uid}/templates 讀回的 { id, ...data } → 與本機相同形狀的範本；壞資料回 null。
export function fromMineRecord(rec) {
  if (!rec || typeof rec.id !== 'string') return null;
  const doc = parseDocJson(rec.docJson);
  if (!doc) return null;
  return {
    id: rec.id, kind: 'tpl', name: cleanName(rec.name), court: doc.court, grade: doc.grade, steps: doc.steps.length, doc,
    folder: typeof rec.folder === 'string' ? rec.folder : '', updatedAt: toMillis(rec.updatedAt),
  };
}

// 共享區搜尋：名稱（不分大小寫）＋場地。
export function filterShared(list, { q = '', court = '' } = {}) {
  const k = String(q).trim().toLowerCase();
  return list.filter(t => (!k || String(t.name || '').toLowerCase().includes(k)) && (!court || t.court === court));
}

// 可當 Firestore 文件 id 的本機範本 id。
export const validDocId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(id);

// 首次登入：本機有、雲端沒有（以 id 判斷）的範本要上傳；本機重複 id 只取第一個；id 不能當文件 id 的給新 id。
export function planFirstUpload(localMine, cloudMine) {
  const seen = new Set((cloudMine || []).map(t => t?.id));
  const out = [];
  for (const t of localMine || []) {
    if (!t || typeof t !== 'object') continue;
    if (!validDocId(t.id)) { out.push({ ...t, id: 't' + uid() }); continue; }
    if (seen.has(t.id)) continue;
    seen.add(t.id); out.push(t);
  }
  return out;
}

// 資料夾合併：保留雲端順序，本機新增的接在後面；去重、去空白。removed（刪除或改名前的舊名）會從結果拿掉。
// changed 為 false 表示結果與雲端相同，不必寫入。
export function planFolderMerge(localFolders, cloudFolders, removed = []) {
  const clean = a => (Array.isArray(a) ? a : []).filter(x => typeof x === 'string' && x);
  const raw = Array.isArray(cloudFolders) ? cloudFolders : [], drop = new Set(removed);
  const merged = [...new Set([...clean(raw), ...clean(localFolders)])].filter(x => !drop.has(x));
  const changed = merged.length !== raw.length || merged.some((x, i) => x !== raw[i]);
  return { merged, changed };
}

export const isAdmin = (email, list) => typeof email === 'string' && !!email && Array.isArray(list) && list.includes(email);

// 雲端錯誤 → { offline: true } 或 { error: code }。
const OFFLINE_CODES = new Set(['unavailable', 'deadline-exceeded', 'timeout', 'offline', 'auth/network-request-failed']);
export function toCloudFailure(err) {
  const code = String(err?.code || '').replace(/^firestore\//, '') || 'unknown';
  return OFFLINE_CODES.has(code) ? { offline: true } : { error: code };
}
