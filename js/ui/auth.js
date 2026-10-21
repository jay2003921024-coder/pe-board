// 頂端登入列，與發布流程共用的「需要登入」提示 modal（AC-19～21）。
// signIn 按下時在同一個 click 中同步呼叫（避免 popup 被擋）；未設定/離線時停用並給 title。
import { onStatus, onUser, signIn, signOut } from '../store/firebase.js';
import { $, hooks, save } from './state.js';

const toast = msg => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2600); };

let status = 'idle', user = null;
let resolveLogin = null, pendingIntent = null;

function renderAuthArea() {
  const el = $('#authArea');
  if (user) {
    el.innerHTML = `<span class="auth-name">${escName(user.name)}</span><button class="btn small" id="btnSignOut" type="button">登出</button>`;
    return;
  }
  const disabled = status !== 'ready';
  const title = status === 'unconfigured' ? '尚未設定 Google 登入'
    : status === 'offline' ? '目前連不到登入服務'
    : status === 'loading' || status === 'idle' ? '登入功能載入中…' : '';
  el.innerHTML = `<button class="btn small" id="btnSignIn" type="button" ${disabled ? 'disabled' : ''} title="${title}">${status === 'loading' || status === 'idle' ? '登入中…' : '登入'}</button>`;
}

const escName = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function doSignIn(intent) {
  const btn = $('#btnSignIn'); if (btn) btn.disabled = true;
  const r = await signIn(intent);
  if (btn) btn.disabled = status !== 'ready';
  return r;
}

function finishLoginPrompt(r) {
  $('#loginPromptModal').hidden = true;
  if (resolveLogin) { const res = resolveLogin; resolveLogin = null; res(r && r.ok ? r : null); }
}

export function initAuth() {
  onStatus(s => { status = s; renderAuthArea(); });
  onUser(u => { user = u; renderAuthArea(); });

  $('#authArea').addEventListener('click', async e => {
    if (e.target.id === 'btnSignIn') {
      const r = await doSignIn();
      if (r.redirect) return; // 頁面即將轉址離開
      if (r.offline) toast('目前連不到登入服務，請稍後再試。');
      else if (r.error && !r.cancelled) toast('登入失敗，請稍後再試一次。');
    } else if (e.target.id === 'btnSignOut') {
      await signOut();
    }
  });

  $('#btnPromptLogin').addEventListener('click', async () => {
    save(); // 登入前先存下目前教案，redirect 後也不遺失（AC-20）
    const btn = $('#btnPromptLogin'); btn.disabled = true;
    const r = await doSignIn(pendingIntent);
    btn.disabled = false;
    if (r.redirect) return; // 頁面即將轉址離開，待辦動作已存 sessionStorage
    if (r.offline) toast('目前連不到登入服務，請稍後再試。');
    else if (r.error) toast('登入失敗，請稍後再試一次。');
    finishLoginPrompt(r);
  });
  $('#loginPromptModal [data-close]').addEventListener('click', () => finishLoginPrompt(null));
  $('#loginPromptModal').addEventListener('click', e => { if (e.target === $('#loginPromptModal')) finishLoginPrompt(null); });

  // sharearea.js 透過這個掛勾開啟「發布需要登入」提示；回傳 signIn() 的結果或 null（取消／失敗）。
  hooks.promptLogin = intent => new Promise(res => {
    resolveLogin = res; pendingIntent = intent;
    $('#loginPromptModal').hidden = false;
  });
}
