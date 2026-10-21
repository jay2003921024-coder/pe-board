// Firestore 存取層：共享區 shared/{id}、我的範本 users/{uid}/templates/{id}、資料夾 users/{uid}.folders。
// 每個函式都不拋錯：成功回 { ok: true, ... }，連不上回 { offline: true }，被拒等其他錯誤回 { error: code }。
import { getFirebase } from './firebase.js';
import { PAGE_SIZE, toSharedRecord, sharedContent, fromSharedRecord, toMineRecord, fromMineRecord, planFolderMerge, toCloudFailure } from '../core/share.js';

const OP_TIMEOUT = 15000;

// getFb 回傳 { db, fs }（fs 為 firestore 模組）或 null；測試時可直接注入 emulator 的實例。
export function createCloud(getFb, timeout = OP_TIMEOUT) {
  async function run(fn) {
    let f;
    try { f = await getFb(); } catch (e) { f = null; }
    if (!f) return { offline: true };
    let timer;
    try {
      const out = await Promise.race([fn(f.db, f.fs), new Promise((_, rej) => { timer = setTimeout(() => rej({ code: 'timeout' }), timeout); })]);
      return { ok: true, ...out };
    } catch (e) {
      return toCloudFailure(e);
    } finally { clearTimeout(timer); }
  }

  return {
    // 依建立時間新到舊；court 有值時篩選場地（需 firestore.indexes.json 的複合索引）。
    // after 傳上一頁回傳的 cursor；回傳 { items, cursor, more }。
    listShared: ({ court = '', after = null, limit = PAGE_SIZE } = {}) => run(async (db, fs) => {
      const parts = [];
      if (court) parts.push(fs.where('court', '==', court));
      parts.push(fs.orderBy('createdAt', 'desc'));
      if (after) parts.push(fs.startAfter(after));
      parts.push(fs.limit(limit));
      const snap = await fs.getDocs(fs.query(fs.collection(db, 'shared'), ...parts));
      return {
        items: snap.docs.map(d => fromSharedRecord({ id: d.id, ...d.data() })).filter(Boolean),
        cursor: snap.docs.at(-1) || null,
        more: snap.docs.length === limit,
      };
    }),

    publish: (tpl, user) => run(async (db, fs) => {
      const ref = fs.doc(fs.collection(db, 'shared'));
      const now = fs.serverTimestamp();
      await fs.setDoc(ref, { ...toSharedRecord(tpl, user), createdAt: now, updatedAt: now });
      return { id: ref.id };
    }),

    // 只更新內容欄位；authorUid、authorName、createdAt 不動。
    updateShared: (id, tpl) => run(async (db, fs) => {
      await fs.updateDoc(fs.doc(db, 'shared', id), { ...sharedContent(tpl), updatedAt: fs.serverTimestamp() });
      return {};
    }),

    deleteShared: id => run(async (db, fs) => { await fs.deleteDoc(fs.doc(db, 'shared', id)); return {}; }),

    // 回傳 { mine, folders }。
    listMine: uid => run(async (db, fs) => {
      const [snap, meta] = await Promise.all([fs.getDocs(fs.collection(db, 'users', uid, 'templates')), fs.getDoc(fs.doc(db, 'users', uid))]);
      const folders = meta.exists() && Array.isArray(meta.data().folders) ? meta.data().folders : [];
      return { mine: snap.docs.map(d => fromMineRecord({ id: d.id, ...d.data() })).filter(Boolean), folders };
    }),

    saveMine: (uid, tpl) => run(async (db, fs) => { await fs.setDoc(fs.doc(db, 'users', uid, 'templates', tpl.id), toMineRecord(tpl)); return {}; }),

    deleteMine: (uid, id) => run(async (db, fs) => { await fs.deleteDoc(fs.doc(db, 'users', uid, 'templates', id)); return {}; }),

    // 與雲端資料夾聯集合併後才寫入（不以本機陣列覆蓋）；removed 為刪除或改名前的舊名。回傳 { folders }（合併結果）。
    saveFolders: (uid, folders, removed = []) => run((db, fs) => fs.runTransaction(db, async tx => {
      const ref = fs.doc(db, 'users', uid);
      const cur = await tx.get(ref);
      const { merged, changed } = planFolderMerge(folders, cur.exists() ? cur.data().folders : [], removed);
      if (changed) tx.set(ref, { folders: merged });
      return { folders: merged };
    })),
  };
}

export const { listShared, publish, updateShared, deleteShared, listMine, saveMine, deleteMine, saveFolders } = createCloud(getFirebase);
