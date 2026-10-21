// AC-18：畫布縮放／平移的 viewBox 計算（純函式，不碰 DOM）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultView, clampView, zoomAt, panBy, zoomLevel } from '../../js/core/viewport.js';

const bounds = { w: 1000, h: 600 };

test('defaultView：回到原尺寸，涵蓋整個場地', () => {
  assert.deepEqual(defaultView(bounds), { x: 0, y: 0, w: 1000, h: 600 });
  assert.equal(zoomLevel(defaultView(bounds), bounds), 1);
});

test('clampView：寬度夾在 bounds.w/4～bounds.w，高度依比例跟著算', () => {
  assert.deepEqual(clampView({ x: 0, y: 0, w: 50, h: 50 }, bounds), { x: 0, y: 0, w: 250, h: 150 });
  assert.deepEqual(clampView({ x: 0, y: 0, w: 5000, h: 5000 }, bounds), { x: 0, y: 0, w: 1000, h: 600 });
});

test('clampView：x/y 夾在畫面範圍內，不會露出場地外', () => {
  const v = clampView({ x: -50, y: 9999, w: 500, h: 300 }, bounds);
  assert.deepEqual(v, { x: 0, y: 300, w: 500, h: 300 });
});

test('zoomAt：放大 2 倍，寬高各減半，且中心點縮放前後的相對位置不變', () => {
  const view = defaultView(bounds);
  const center = { x: 400, y: 240 }; // view 內比例 (0.4, 0.4)
  const v = zoomAt(view, center, 2, bounds);
  assert.equal(v.w, 500);
  assert.equal(v.h, 300);
  assert.equal((center.x - v.x) / v.w, 0.4);
  assert.equal((center.y - v.y) / v.h, 0.4);
});

test('zoomAt：縮放倍率夾在 1～4（w 不會小於 bounds.w/4）', () => {
  const view = defaultView(bounds);
  const v = zoomAt(view, { x: 500, y: 300 }, 100, bounds);
  assert.equal(v.w, 250);
  assert.equal(zoomLevel(v, bounds), 4);
});

test('zoomAt：縮小回去不會小於 1 倍（w 不超過 bounds.w）', () => {
  const zoomed = clampView({ x: 100, y: 50, w: 400, h: 240 }, bounds);
  const v = zoomAt(zoomed, { x: 300, y: 170 }, 0.01, bounds);
  assert.deepEqual(v, defaultView(bounds));
});

test('panBy：平移場地座標的位移量，並夾在邊界內', () => {
  const view = { x: 100, y: 50, w: 400, h: 240 };
  assert.deepEqual(panBy(view, 10, -10, bounds), { x: 110, y: 40, w: 400, h: 240 });
  assert.deepEqual(panBy(view, 9999, 9999, bounds), { x: 600, y: 360, w: 400, h: 240 });
  assert.deepEqual(panBy(view, -9999, -9999, bounds), { x: 0, y: 0, w: 400, h: 240 });
});

test('panBy：已經是原尺寸（w=bounds.w）時，平移沒有效果', () => {
  assert.deepEqual(panBy(defaultView(bounds), 50, 50, bounds), defaultView(bounds));
});
