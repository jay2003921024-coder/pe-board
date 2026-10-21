// smoke test：段落標記一旦失效，在這裡以清楚的訊息失敗。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLegacy, sectionNames } from '../helpers/legacy.js';

test('舊版段落標記都找得到', () => {
  for (const n of ['Courts', 'Objects', 'Templates', 'State', 'Rendering', 'Step animation', 'Export']) {
    assert.ok(sectionNames().includes(n), `缺少段落「${n}」，現有：${sectionNames().join('、')}`);
  }
});

test('前導段一律先執行', () => {
  const L = loadLegacy([]);
  assert.equal(L.W, 1000);
  for (const n of ['uid', 'f', 'esc']) assert.equal(typeof L[n], 'function', n);
});

test('Courts、Objects、Rendering 段落回傳的函式都是 function', () => {
  const L = loadLegacy(['Courts', 'Objects', 'Rendering'], { globals: { ui: { team: 'red' }, doc: { court: 'bb-half' } } });
  for (const n of ['scaleOf', 'courtH', 'courtSVG', 'isLine', 'shape', 'textHalfW', 'clampSize', 'selR', 'itemSVG', 'qpt', 'qder', 'lineSVG', 'boardContent', 'iconSVG']) {
    assert.equal(typeof L[n], 'function', n);
  }
  assert.equal(L.TEXT_MAX, 120);
});

test('找不到的段落或名稱會清楚報錯', () => {
  assert.throws(() => loadLegacy(['不存在']), /找不到段落「不存在」/);
  assert.throws(() => loadLegacy(['Courts']).notThere, /沒有「notThere」/);
});

test('固定種子讓 uid 可重現', () => {
  assert.equal(loadLegacy([], { seed: 7 }).uid(), loadLegacy([], { seed: 7 }).uid());
});
