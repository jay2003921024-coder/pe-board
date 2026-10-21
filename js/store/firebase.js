// Firebase 背景載入：畫布第一次渲染後由 main.js 以不阻塞方式呼叫 initFirebase()。
// 以 import() 從 gstatic CDN 載入固定版本的模組化 SDK；未設定、載入失敗、逾時都只把狀態設成離線，絕不拋錯（AC-27）。
import { FIREBASE_CONFIG, ADMIN_EMAILS, EMULATOR_CONFIG, isConfigured } from '../config/firebase-config.js';
import { isAdmin } from '../core/share.js';

export const SDK_VERSION = '12.19.0';
const SDK_URL = name => `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-${name}.js`;
export const RESUME_KEY = 'pe-board-resume';

const defaults = () => ({
  config: FIREBASE_CONFIG,
  timeout: 8000,
  load: () => Promise.all(['app', 'auth', 'firestore'].map(n => import(SDK_URL(n)))),
  storage: () => globalThis.sessionStorage,
  emulator: () => { try { return ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('emulator'); } catch (e) { return false; } },
});
let opt = defaults();

let fb = null;          // { app, auth, db, au, fs }：au／fs 為 auth／firestore 模組
let loading = null;
let status = 'idle';    // idle | loading | ready | offline | unconfigured
let user = null, userKnown = false, pendingResume = null;
const userCbs = new Set(), resumeCbs = new Set(), statusCbs = new Set();

const emit = (cbs, v) => { for (const cb of cbs) { try { cb(v); } catch (e) { console.error(e); } } };
const setStatus = s => { if (status !== s) { status = s; emit(statusCbs, s); } };
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'timeout' })), ms))]);

function toUser(u) {
  if (!u) return null;
  const email = u.email || '';
  return { uid: u.uid, name: u.displayName || email.split('@')[0] || '老師', email, isAdmin: !!u.emailVerified && isAdmin(email, ADMIN_EMAILS) };
}

function storage() { try { return opt.storage() || null; } catch (e) { return null; } }
function takeResume() {
  const s = storage();
  try { const raw = s?.getItem(RESUME_KEY); s?.removeItem(RESUME_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

async function load() {
  const emu = opt.emulator();
  const config = emu ? EMULATOR_CONFIG : opt.config;
  if (!isConfigured(config)) { setStatus('unconfigured'); return null; }
  setStatus('loading');
  try {
    const [ap, au, fs] = await withTimeout(opt.load(), opt.timeout);
    const app = ap.getApps().length ? ap.getApp() : ap.initializeApp(config);
    const auth = au.getAuth(app), db = fs.getFirestore(app);
    if (emu) { au.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); fs.connectFirestoreEmulator(db, '127.0.0.1', 8080); }
    fb = { app, auth, db, au, fs };
  } catch (e) {
    console.warn('Firebase 載入失敗，共享區改為離線', e);
    setStatus('offline'); loading = null; // 下次 getFirebase() 會重試
    return null;
  }
  // 轉址登入回來：一律呼叫 getRedirectResult，成功才記下待辦動作；要等 onAuthStateChanged 的初次回呼
  // 設好 currentUser() 之後才交給 UI，否則 onResume 訂閱者看到的還會是未登入狀態（AC-20）。
  let resumeIntent = null;
  try {
    const r = await withTimeout(fb.au.getRedirectResult(fb.auth), opt.timeout);
    const intent = takeResume();
    if (r?.user && intent) resumeIntent = intent;
  } catch (e) { takeResume(); console.warn('轉址登入失敗', e); }
  let firstAuth = true;
  fb.au.onAuthStateChanged(fb.auth, u => {
    user = toUser(u); userKnown = true; emit(userCbs, user);
    if (firstAuth) {
      firstAuth = false;
      if (resumeIntent) {
        pendingResume = resumeIntent;
        emit(resumeCbs, resumeIntent);
        if (resumeCbs.size) pendingResume = null; // 已經有訂閱者收到了，避免之後晚註冊的再收到一次
      }
    }
  });
  setStatus('ready');
  return fb;
}

// 開機背景初始化；可重複呼叫，永遠 resolve。
export function initFirebase() {
  if (fb) return Promise.resolve(fb);
  if (!loading) loading = load().catch(e => { console.warn(e); setStatus('offline'); loading = null; return null; });
  return loading;
}

// 回傳 { auth, db, au, fs, app } 或 null（未設定、載入失敗、逾時）。
export const getFirebase = () => initFirebase();

export const getStatus = () => status;
export const currentUser = () => user;

function subscribe(cbs, cb, now) {
  cbs.add(cb);
  if (now) now();
  return () => cbs.delete(cb);
}
export const onStatus = cb => subscribe(statusCbs, cb, () => cb(status));
// 回呼收到 { uid, name, email, isAdmin } 或 null；已知登入狀態時立即呼叫一次。
export const onUser = cb => subscribe(userCbs, cb, userKnown && (() => cb(user)));
// 轉址登入回來的待辦動作（例如 { action: 'publish', tplId }）；只交出一次。
export const onResume = cb => subscribe(resumeCbs, cb, pendingResume && (() => { const v = pendingResume; pendingResume = null; cb(v); }));

// 在按鈕 click 中呼叫：SDK 已載入時同步開 popup；popup 被擋或環境不支援時存下 resumeIntent 並改走 redirect。
// 回傳 { ok, user } | { cancelled } | { redirect } | { offline } | { error }，不拋錯。
export async function signIn(resumeIntent) {
  const f = fb || await getFirebase();
  if (!f) return { offline: true };
  const provider = new f.au.GoogleAuthProvider();
  try {
    const r = await f.au.signInWithPopup(f.auth, provider);
    return { ok: true, user: toUser(r.user) };
  } catch (e) {
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return { cancelled: true };
    if (e?.code !== 'auth/popup-blocked' && e?.code !== 'auth/operation-not-supported-in-this-environment') return failure(e);
  }
  try {
    if (resumeIntent) storage()?.setItem(RESUME_KEY, JSON.stringify(resumeIntent));
    await f.au.signInWithRedirect(f.auth, provider);
    return { redirect: true };
  } catch (e) { return failure(e); }
}

export async function signOut() {
  if (!fb) return { ok: true };
  try { await fb.au.signOut(fb.auth); return { ok: true }; } catch (e) { return failure(e); }
}

function failure(e) {
  const code = String(e?.code || 'unknown');
  return code === 'auth/network-request-failed' ? { offline: true } : { error: code };
}

// 只給測試用：替換設定／載入器／逾時，並重設內部狀態。
export function _resetForTest(o = {}) {
  opt = { ...defaults(), emulator: () => false, ...o };
  fb = null; loading = null; status = 'idle'; user = null; userKnown = false; pendingResume = null;
  userCbs.clear(); resumeCbs.clear(); statusCbs.clear();
}
