// AC-27：Firebase 未設定、載入失敗、逾時都只回報離線，不拋錯；存取層回 { offline: true }。
// 以假的 SDK 模組測 js/store/firebase.js 的流程（轉址登入復原、使用者資訊、管理員判斷）。
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initFirebase, getFirebase, getStatus, onStatus, onUser, onResume, currentUser, signIn, RESUME_KEY, _resetForTest } from '../../js/store/firebase.js';
import * as cloud from '../../js/store/cloud.js';
import { createCloud } from '../../js/store/cloud.js';
import { ADMIN_EMAILS } from '../../js/config/firebase-config.js';

const CONFIG = { apiKey: 'k', authDomain: 'p.firebaseapp.com', projectId: 'p', appId: 'a' };
const memStorage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };

function fakeSdk({ redirectUser = null, authUser = null, popup } = {}) {
  const calls = [];
  const app = { getApps: () => [], getApp: () => ({}), initializeApp: c => ({ config: c }) };
  const au = {
    getAuth: a => ({ app: a }),
    getRedirectResult: async () => (redirectUser ? { user: redirectUser } : null),
    onAuthStateChanged: (auth, cb) => { setTimeout(() => cb(authUser), 0); return () => {}; },
    GoogleAuthProvider: class {},
    signInWithPopup: popup || (async () => ({ user: authUser })),
    signInWithRedirect: async () => { calls.push('redirect'); },
    signOut: async () => {},
  };
  const fs = { getFirestore: a => ({ db: a }) };
  return { load: async () => [app, au, fs], calls };
}

afterEach(() => _resetForTest());

test('未設定：不載入 SDK、狀態 unconfigured、存取層回 offline', async () => {
  let loaded = false;
  _resetForTest({ load: async () => { loaded = true; return []; } });
  assert.equal(await getFirebase(), null);
  assert.equal(getStatus(), 'unconfigured');
  assert.equal(loaded, false);
  assert.deepEqual(await cloud.listShared(), { offline: true });
  assert.deepEqual(await cloud.publish({ doc: {} }, { uid: 'u' }), { offline: true });
  assert.deepEqual(await cloud.saveFolders('u', ['a']), { offline: true });
  assert.deepEqual(await signIn(), { offline: true });
});

test('CDN 載入失敗：initFirebase 不拋錯、狀態 offline，下次會重試', async () => {
  let n = 0;
  const seen = [];
  _resetForTest({ config: CONFIG, load: async () => { n++; throw new TypeError('Failed to fetch dynamically imported module'); } });
  onStatus(s => seen.push(s));
  const warn = console.warn; console.warn = () => {};
  try {
    assert.equal(await initFirebase(), null);
    assert.equal(getStatus(), 'offline');
    assert.deepEqual(seen, ['idle', 'loading', 'offline']);
    assert.equal(await getFirebase(), null);
    assert.equal(n, 2, '失敗後再次呼叫會重試');
  } finally { console.warn = warn; }
});

test('載入逾時：回報離線', async () => {
  _resetForTest({ config: CONFIG, timeout: 20, load: () => new Promise(() => {}) });
  const warn = console.warn; console.warn = () => {};
  try {
    assert.equal(await initFirebase(), null);
    assert.equal(getStatus(), 'offline');
  } finally { console.warn = warn; }
});

test('存取層：Firestore 操作逾時或拋錯都轉成結果物件', async () => {
  const hang = createCloud(async () => ({ db: {}, fs: { collection: () => ({}), orderBy: () => ({}), limit: () => ({}), query: () => ({}), getDocs: () => new Promise(() => {}) } }), 20);
  assert.deepEqual(await hang.listShared(), { offline: true });
  const deny = createCloud(async () => ({ db: {}, fs: { doc: () => ({}), deleteDoc: async () => { throw { code: 'permission-denied' }; } } }));
  assert.deepEqual(await deny.deleteShared('x'), { error: 'permission-denied' });
  const broken = createCloud(async () => { throw new Error('boom'); });
  assert.deepEqual(await broken.deleteMine('u', 'x'), { offline: true });
});

test('正常載入：一律呼叫 getRedirectResult；使用者資訊含管理員判斷（需 email 已驗證）', async () => {
  const sdk = fakeSdk({ authUser: { uid: 'u1', displayName: '王老師', email: ADMIN_EMAILS[0], emailVerified: true } });
  _resetForTest({ config: CONFIG, load: sdk.load, storage: memStorage });
  const users = [];
  onUser(u => users.push(u));
  const f = await initFirebase();
  assert.ok(f.auth && f.db && f.fs && f.au);
  assert.equal(getStatus(), 'ready');
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(users, [{ uid: 'u1', name: '王老師', email: ADMIN_EMAILS[0], isAdmin: true }]);
  const late = [];
  onUser(u => late.push(u));
  assert.equal(late.length, 1, '晚註冊的也會立即收到目前使用者');
});

test('email 未驗證不是管理員；沒有顯示名稱時用 email 前綴', async () => {
  const sdk = fakeSdk({ authUser: { uid: 'u1', email: ADMIN_EMAILS[0], emailVerified: false } });
  _resetForTest({ config: CONFIG, load: sdk.load, storage: memStorage });
  const users = [];
  onUser(u => users.push(u));
  await initFirebase();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(users[0].isAdmin, false);
  assert.equal(users[0].name, ADMIN_EMAILS[0].split('@')[0]);
});

test('popup 被擋：存下 resumeIntent 改走 redirect；回來後 onResume 交出一次並清除', async () => {
  const store = memStorage();
  const blocked = fakeSdk({ popup: async () => { throw { code: 'auth/popup-blocked' }; } });
  _resetForTest({ config: CONFIG, load: blocked.load, storage: () => store });
  await initFirebase();
  assert.deepEqual(await signIn({ action: 'publish', tplId: 't1' }), { redirect: true });
  assert.deepEqual(blocked.calls, ['redirect']);
  assert.equal(store.getItem(RESUME_KEY), JSON.stringify({ action: 'publish', tplId: 't1' }));

  // 頁面重新載入（轉址回來）
  const back = fakeSdk({ redirectUser: { uid: 'u1' }, authUser: { uid: 'u1' } });
  _resetForTest({ config: CONFIG, load: back.load, storage: () => store });
  const early = [];
  onResume(v => early.push(v));
  await initFirebase();
  await new Promise(r => setTimeout(r, 5)); // onResume 要等 onAuthStateChanged 的初次回呼設好 currentUser() 才交出（AC-20）
  assert.deepEqual(early, [{ action: 'publish', tplId: 't1' }]);
  assert.equal(store.getItem(RESUME_KEY), null);
});

test('onResume 觸發時 currentUser() 已經是轉址登入回來的使用者（AC-20：不應再跳一次登入提示）', async () => {
  const store = memStorage();
  store.setItem(RESUME_KEY, JSON.stringify({ action: 'publish', tplId: 't1' }));
  const back = fakeSdk({ redirectUser: { uid: 'u1' }, authUser: { uid: 'u1', displayName: 'Jay' } });
  _resetForTest({ config: CONFIG, load: back.load, storage: () => store });
  let userAtResume;
  onResume(() => { userAtResume = currentUser(); });
  await initFirebase();
  await new Promise(r => setTimeout(r, 5));
  assert.ok(userAtResume, 'onResume 觸發時 currentUser() 不應該是 null');
  assert.equal(userAtResume.uid, 'u1');
});

test('onResume 晚註冊也拿得到，但只交出一次；沒有轉址結果時清掉舊的待辦', async () => {
  const store = memStorage();
  store.setItem(RESUME_KEY, JSON.stringify({ action: 'publish' }));
  _resetForTest({ config: CONFIG, load: fakeSdk({ redirectUser: { uid: 'u' } }).load, storage: () => store });
  await initFirebase();
  const a = [], b = [];
  onResume(v => a.push(v)); // 在 onAuthStateChanged 的初次回呼觸發前訂閱，會收到這次的待辦
  await new Promise(r => setTimeout(r, 5)); // onResume 要等 onAuthStateChanged 的初次回呼設好 currentUser() 才交出（AC-20）
  onResume(v => b.push(v)); // 事件已經處理完才訂閱，不會重複收到
  assert.deepEqual(a, [{ action: 'publish' }]); assert.deepEqual(b, []);

  store.setItem(RESUME_KEY, JSON.stringify({ action: 'stale' }));
  _resetForTest({ config: CONFIG, load: fakeSdk().load, storage: () => store });
  const c = [];
  onResume(v => c.push(v));
  await initFirebase();
  assert.deepEqual(c, []);
  assert.equal(store.getItem(RESUME_KEY), null);
});

test('signIn：使用者關閉 popup 回 cancelled；其他錯誤帶 code；成功回使用者', async () => {
  _resetForTest({ config: CONFIG, load: fakeSdk({ popup: async () => { throw { code: 'auth/popup-closed-by-user' }; } }).load, storage: memStorage });
  assert.deepEqual(await signIn(), { cancelled: true });
  _resetForTest({ config: CONFIG, load: fakeSdk({ popup: async () => { throw { code: 'auth/internal-error' }; } }).load, storage: memStorage });
  assert.deepEqual(await signIn(), { error: 'auth/internal-error' });
  _resetForTest({ config: CONFIG, load: fakeSdk({ popup: async () => { throw { code: 'auth/network-request-failed' }; } }).load, storage: memStorage });
  assert.deepEqual(await signIn(), { offline: true });
  _resetForTest({ config: CONFIG, load: fakeSdk({ authUser: { uid: 'u9', displayName: 'X', email: 'x@y.z', emailVerified: true } }).load, storage: memStorage });
  assert.deepEqual(await signIn(), { ok: true, user: { uid: 'u9', name: 'X', email: 'x@y.z', isAdmin: false } });
});
