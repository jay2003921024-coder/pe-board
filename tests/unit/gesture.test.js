// AC-15、AC-18：手勢判定純函式測試。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { touchOwner, blankIsNative } from '../../js/core/gesture.js';

test('touchOwner：touchCount >= 2（第二指落下）→ app', () => {
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: false, onTarget: false, touchCount: 2 }), 'app');
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: false, onTarget: false, touchCount: 3 }), 'app');
});

test('touchOwner：animating（正在播放動畫，按下＝停止播放）→ app', () => {
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: false, onTarget: false, touchCount: 1, animating: true }), 'app');
});

test('touchOwner：onTarget（按到物件或把手）→ app', () => {
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: false, onTarget: true, touchCount: 1 }), 'app');
});

test('touchOwner：tool !== select（任何放置／畫線工具）→ app', () => {
  assert.equal(touchOwner({ tool: 'player', multi: false, zoomed: false, onTarget: false, touchCount: 1 }), 'app');
  assert.equal(touchOwner({ tool: 'cone', multi: false, zoomed: false, onTarget: false, touchCount: 1 }), 'app');
  assert.equal(touchOwner({ tool: 'line-pass', multi: false, zoomed: false, onTarget: false, touchCount: 1 }), 'app');
  assert.equal(touchOwner({ tool: 'zone', multi: false, zoomed: false, onTarget: false, touchCount: 1 }), 'app');
});

test('touchOwner：multi（多選模式，空白處拖曳＝框選）→ app', () => {
  assert.equal(touchOwner({ tool: 'select', multi: true, zoomed: false, onTarget: false, touchCount: 1 }), 'app');
});

test('touchOwner：zoomed（畫布已放大，空白處拖曳＝平移畫布）→ app', () => {
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: true, onTarget: false, touchCount: 1 }), 'app');
});

test('touchOwner：選取工具＋空白處＋未放大 → native', () => {
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: false, onTarget: false, touchCount: 1, animating: false }), 'native');
});

test('touchOwner：優先順序符合契約定義', () => {
  // 第二指落下優先於選取工具、空白處、未放大
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: false, onTarget: false, touchCount: 2, animating: false }), 'app');
  // 正在播放動畫優先於選取工具、空白處、未放大
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: false, onTarget: false, touchCount: 1, animating: true }), 'app');
  // 按在物件上優先於選取工具、未放大
  assert.equal(touchOwner({ tool: 'select', multi: false, zoomed: false, onTarget: true, touchCount: 1, animating: false }), 'app');
  // 放置工具優先於非多選、未放大
  assert.equal(touchOwner({ tool: 'ball', multi: false, zoomed: false, onTarget: false, touchCount: 1, animating: false }), 'app');
  // 多選模式優先於未放大
  assert.equal(touchOwner({ tool: 'select', multi: true, zoomed: false, onTarget: false, touchCount: 1, animating: false }), 'app');
});

test('blankIsNative：判斷按在空白處時是否交給瀏覽器原生捲動', () => {
  assert.equal(blankIsNative({ tool: 'select', multi: false, zoomed: false, animating: false }), true);
  assert.equal(blankIsNative({ tool: 'player', multi: false, zoomed: false, animating: false }), false);
  assert.equal(blankIsNative({ tool: 'select', multi: true, zoomed: false, animating: false }), false);
  assert.equal(blankIsNative({ tool: 'select', multi: false, zoomed: true, animating: false }), false);
  assert.equal(blankIsNative({ tool: 'select', multi: false, zoomed: false, animating: true }), false);
});
