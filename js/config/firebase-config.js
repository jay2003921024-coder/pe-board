// Firebase 公開設定值（009 由使用者從 Firebase 主控台貼上）與管理員名單。
// 這些值本來就會出現在網頁原始碼裡，不是密碼；真正的權限由 firestore.rules 把關。
// ADMIN_EMAILS 必須與 firestore.rules 中 ADMIN_EMAILS:BEGIN/END 之間的名單相同（tests/unit/config.test.js 會檢查）。

export const FIREBASE_CONFIG = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

export const ADMIN_EMAILS = [
  'admin@example.com',
];

// 本機開發：在 localhost 網址加上 ?emulator 時改連 Firebase emulator（不需要真的專案）。
export const EMULATOR_CONFIG = { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-pe-board', appId: 'demo-app' };

const REQUIRED = ['apiKey', 'authDomain', 'projectId', 'appId'];
export const isConfigured = (c = FIREBASE_CONFIG) =>
  !!c && REQUIRED.every(k => typeof c[k] === 'string' && c[k] && !c[k].includes('REPLACE_ME'));
