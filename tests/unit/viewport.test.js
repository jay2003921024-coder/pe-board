// AC-18：畫布縮放／平移的 viewBox 計算（純函式，不碰 DOM）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultView, clampView, zoomAt, panBy, zoomLevel,
  INERTIA, clampVelocity, velocityAt, distanceAt, inertiaStopTime, totalInertiaDistance,
  inertiaStepper, clampScroll, edgeVelocity, EDGE_EPS,
} from '../../js/core/viewport.js';

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

test('zoomAt：014 回饋的例子——在 (300,200) 捏合放大 2 倍，該點對應的畫布座標不變', () => {
  const view = defaultView(bounds);
  const center = { x: 300, y: 200 };
  const v = zoomAt(view, center, 2, bounds);
  // 縮放前後，螢幕上同一個點（兩指中點）對應到的場地座標要相同：
  // 縮放前它在 view 內的比例乘上新 view 的寬高、加上新 view 的原點，應該還是原來那個點。
  assert.equal(v.x + (center.x - view.x) / view.w * v.w, center.x);
  assert.equal(v.y + (center.y - view.y) / view.h * v.h, center.y);
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

// AC-18 加強：慣性滑行（放開手指後依速度繼續滑行，逐漸減速停止）的純函式。
test('clampVelocity：夾在 ±maxVelocity 之間', () => {
  assert.equal(clampVelocity(10), INERTIA.maxVelocity);
  assert.equal(clampVelocity(-10), -INERTIA.maxVelocity);
  assert.equal(clampVelocity(0.5), 0.5);
});

test('velocityAt：速度隨時間以 decayPerMs 的比例遞減，t=0 時等於初速', () => {
  assert.equal(velocityAt(2, 0), 2);
  const v1 = velocityAt(2, 1000);
  assert.ok(v1 > 0 && v1 < 2, '1 秒後速度應該比初速小且仍同方向');
  assert.equal(velocityAt(2, 1000), 2 * Math.pow(INERTIA.decayPerMs, 1000));
});

test('velocityAt：初速為 0 時全程維持 0（不會無中生有滑行）', () => {
  assert.equal(velocityAt(0, 500), 0);
});

test('inertiaStopTime：初速已經低於 minVelocity 時，立即停止（0 毫秒）', () => {
  assert.equal(inertiaStopTime(INERTIA.minVelocity / 2), 0);
});

test('inertiaStopTime 與 velocityAt：在算出的停止時間點，速度剛好降到 minVelocity', () => {
  const v0 = 1.5;
  const t = inertiaStopTime(v0);
  assert.ok(Math.abs(Math.abs(velocityAt(v0, t)) - INERTIA.minVelocity) < 1e-9);
});

test('distanceAt：t=0 沒有位移；位移方向跟初速方向一致', () => {
  assert.equal(Math.abs(distanceAt(1.5, 0)), 0);
  assert.ok(distanceAt(1.5, 500) > 0);
  assert.ok(distanceAt(-1.5, 500) < 0);
});

test('totalInertiaDistance：給定初速 1.5（場地單位/毫秒），滑行總距離與停止時間符合指數衰減模型的封閉解', () => {
  const v0 = 1.5;
  const t = inertiaStopTime(v0);
  // 停止時間：由 minVelocity = v0 · decayPerMs^t 反解
  assert.ok(Math.abs(t - Math.log(INERTIA.minVelocity / v0) / Math.log(INERTIA.decayPerMs)) < 1e-9);
  // 總距離：velocityAt 對時間從 0 積分到 t 的封閉解
  const expectedDistance = v0 * (Math.pow(INERTIA.decayPerMs, t) - 1) / Math.log(INERTIA.decayPerMs);
  assert.ok(Math.abs(totalInertiaDistance(v0) - expectedDistance) < 1e-9);
  assert.ok(totalInertiaDistance(v0) > 0);
});

test('totalInertiaDistance：初速越快，總滑行距離越遠', () => {
  assert.ok(totalInertiaDistance(2) > totalInertiaDistance(1));
});

// verify-r7：慣性撞到邊界要停，不能繼續空轉。
const runStepper = (step, frameMs = 16, maxFrames = 2000) => {
  let frames = 0;
  while (frames < maxFrames && step(++frames * frameMs));
  return frames;
};

test('inertiaStepper：沒撞到邊界時跑完整段，總位移等於 totalInertiaDistance', () => {
  let moved = 0;
  const step = inertiaStepper(0, -2, (dx, dy) => { moved += dy; });
  runStepper(step);
  assert.ok(Math.abs(moved - totalInertiaDistance(-2)) < 1e-6);
});

test('inertiaStepper：apply 回傳 false 後立刻停止，不再呼叫 apply', () => {
  // 頁面 scrollY=468、max=486，往上甩（頁面往下捲），撞到 486 就該停。
  let y = 468, calls = 0, callsAtMax = 0;
  const step = inertiaStepper(0, -2, (dx, dy) => {
    calls++;
    if (y >= 486) callsAtMax++;
    const next = clampScroll({ x: 0, y }, { x: dx, y: dy }, { x: 0, y: 486 });
    y = next.y;
    return !next.stop;
  });
  const frames = runStepper(step);
  assert.equal(y, 486);
  assert.equal(callsAtMax, 0, '已經在底端之後不應該再推');
  assert.equal(calls, frames, '回傳 false 的那一幀之後沒有下一幀');
  assert.ok(frames < inertiaStopTime(2) / 16, '比自然停止更早結束');
});

test('inertiaStepper：初速太小不滑行', () => {
  assert.equal(inertiaStepper(0, 0, () => {}), null);
  assert.equal(inertiaStepper(INERTIA.minVelocity / 2, 0, () => {}), null);
});

test('clampScroll：撞到底端才算 stop', () => {
  const max = { x: 0, y: 486 };
  assert.deepEqual(clampScroll({ x: 0, y: 470 }, { x: 0, y: -32 }, max), { x: 0, y: 486, stop: true });
  assert.deepEqual(clampScroll({ x: 0, y: 200 }, { x: 0, y: -10 }, max), { x: 0, y: 210, stop: false });
  assert.deepEqual(clampScroll({ x: 0, y: 5 }, { x: 0, y: 10 }, max), { x: 0, y: 0, stop: true });
});

test('clampScroll：垂直滑動帶一點水平分量、頁面沒有水平捲軸時，不能提早停', () => {
  const r = clampScroll({ x: 0, y: 200 }, { x: 2, y: -10 }, { x: 0, y: 486 });
  assert.equal(r.x, 0);
  assert.equal(r.y, 210);
  assert.equal(r.stop, false);
});

test('edgeVelocity：已貼在邊界且往外甩才歸零，容許次像素誤差', () => {
  assert.equal(EDGE_EPS, 1);
  assert.equal(edgeVelocity(-1, 485.5, 486), 0);
  assert.equal(edgeVelocity(-1, 400, 486), -1);
  assert.equal(edgeVelocity(1, 0.5, 486), 0);
  assert.equal(edgeVelocity(1, 485.5, 486), 1, '在底端往回甩要能滑');
  assert.equal(edgeVelocity(-1, 0, 486), -1, '在頂端往下捲要能滑');
});
