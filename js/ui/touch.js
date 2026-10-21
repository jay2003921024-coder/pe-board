// 平板觸控操作列（復原／重做沿用既有按鈕）、防誤觸、螢幕鍵盤遮擋處理。畫布互動與雙指縮放在 editor.js／board.js。
import { $, state, hooks, resetView } from './state.js';

function renderTouchBar() {
  const bar = $('#touchBar'); if (!bar) return;
  bar.innerHTML = `
    <button type="button" class="btn small" id="btnTouchDup" title="複製 (Ctrl+D)">複製</button>
    <button type="button" class="btn small danger" id="btnTouchDel" title="刪除 (Delete)">刪除</button>
    <button type="button" class="btn small" id="btnTouchMulti" aria-pressed="${state.ui.multi}" title="開啟後，點物件可以加入或移除選取（取代 Shift+點）">多選</button>
    <button type="button" class="btn small" id="btnTouchZoomReset" title="畫布縮放回 100%">縮放 100%</button>`;
}

function initTouchBar() {
  renderTouchBar();
  const bar = $('#touchBar');
  if (!bar) return;
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'btnTouchDup') hooks.dupSel();
    else if (b.id === 'btnTouchDel') hooks.deleteSel();
    else if (b.id === 'btnTouchMulti') { state.ui.multi = !state.ui.multi; renderTouchBar(); }
    else if (b.id === 'btnTouchZoomReset') resetView();
  });
}

// AC-17：螢幕鍵盤彈出時（visualViewport 變矮），把被遮住的輸入欄位捲進可見區。
function scrollFocusedIntoView() {
  const el = document.activeElement;
  if (!el || !el.matches('input,textarea')) return;
  const vv = window.visualViewport;
  if (vv) {
    const r = el.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= vv.height) return;
  }
  el.scrollIntoView({ block: 'center' });
}

function initScreenKeyboardGuard() {
  window.visualViewport?.addEventListener('resize', scrollFocusedIntoView);
}

// AC-15：畫布範圍內防止 iOS 雙指／雙擊把整個頁面放大（只限畫布，不影響全站的可及性縮放）。
function initGestureGuard() {
  const canvas = document.querySelector('.canvas-wrap');
  if (!canvas) return;
  canvas.addEventListener('gesturestart', e => e.preventDefault());
  canvas.addEventListener('dblclick', e => e.preventDefault());
}

export function initTouch() {
  initTouchBar();
  initScreenKeyboardGuard();
  initGestureGuard();
}
