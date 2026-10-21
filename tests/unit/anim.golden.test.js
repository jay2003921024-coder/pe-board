// AC-4、AC-13：動畫步驟間的物件配對與路徑與舊版相同。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLegacy } from '../helpers/legacy.js';
import { ease, sameZone, matchItems, findPath, planTransition, posAt } from '../../js/core/anim.js';

// 舊版 planTransition 讀全域 doc：以 L.doc = d 注入。
const L = loadLegacy(['Courts', 'Objects', 'Rendering', 'Step animation'], { globals: { ui: { team: 'red' } } });
const T = loadLegacy(['Courts', 'Objects', 'Templates'], { seed: 11 });
const docs = structuredClone(T.TEMPLATES.map(t => T.docFromTemplate(t)));

// 把計畫轉成「在上一步／下一步 items 中的索引」，與物件 realm 無關。
function repr(d, i, p) {
  const A = d.steps[i].items, B = d.steps[i + 1].items, a = o => A.indexOf(o), b = o => B.indexOf(o);
  return {
    moves: p.moves.map(m => [a(m.a), b(m.b), m.path ? a(m.path) : -1]),
    gone: p.gone.map(a), appear: p.appear.map(b),
    zonesKeep: p.zonesKeep.map(b), zonesOut: p.zonesOut.map(a), zonesIn: p.zonesIn.map(b), linesOut: p.linesOut.map(a),
  };
}
function same(d, i) {
  L.doc = d;
  const mine = planTransition(d, i), old = L.planTransition(i);
  assert.deepEqual(repr(d, i, mine), structuredClone(repr(d, i, old)));
  for (const e of [0, 0.13, 0.5, 0.87, 1]) mine.moves.forEach((m, k) => assert.deepEqual(posAt(m, e), structuredClone(L.posAt(old.moves[k], e))));
  return mine;
}
const by = (B, o) => B.indexOf(o);

test('ease 與舊版相同', () => {
  for (let t = 0; t <= 1; t += 0.05) assert.equal(ease(t), L.ease(t));
});

docs.forEach((d, n) => {
  test(`範本 ${n + 1}「${d.title}」：每個步驟轉換的配對、路徑、位置相同`, () => {
    for (let i = 0; i < d.steps.length - 1; i++) same(d, i);
    // 反向播放（下一步→上一步）也要相同
    const rev = { ...d, steps: [...d.steps].reverse() };
    for (let i = 0; i < rev.steps.length - 1; i++) same(rev, i);
  });
});

test('任兩個範本的第一步互相轉換：配對結果相同（最近距離、同號、消失／出現）', () => {
  for (const a of docs) for (const b of docs) same({ ...a, steps: [a.steps[0], b.steps.at(-1)] }, 0);
});

// ---- 手寫案例 ----
const P = (id, team, label, x, y) => ({ id, type: 'player', team, label, x, y });
const O = (id, type, x, y, extra = {}) => ({ id, type, x, y, ...extra });
const Ln = (id, type, x1, y1, x2, y2) => ({ id, type, x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 });

test('同 id 優先於同號與距離', () => {
  const A = [P('p1', 'red', '1', 0, 0), P('p2', 'red', '1', 500, 500)];
  const B = [P('p1', 'red', '1', 500, 500)];
  const d = { steps: [{ items: A }, { items: B }] };
  const { moves, gone } = same(d, 0);
  assert.equal(moves[0].a, A[0]);
  assert.deepEqual(gone, [A[1]]);
});

test('同 id 但類型不同不配對', () => {
  const { map } = matchItems([O('x', 'cone', 0, 0)], [O('x', 'disc', 0, 0)]);
  assert.equal(map.size, 0);
});

test('學生／老師：同隊同號優先於最近距離', () => {
  const A = [P('a1', 'red', '1', 100, 100), P('a2', 'red', '2', 110, 100), P('a3', 'blue', '1', 105, 100)];
  const B = [P('b2', 'red', '2', 100, 100), P('b1', 'red', 1, 110, 100), P('b3', 'blue', '1', 900, 900)];
  const d = { steps: [{ items: A }, { items: B }] };
  const { moves } = same(d, 0);
  const pairs = Object.fromEntries(moves.map(m => [m.b.id, m.a.id]));
  assert.deepEqual(pairs, { b2: 'a2', b1: 'a1', b3: 'a3' });
});

test('其他物件：同類型最近距離配對，多出來的消失／出現', () => {
  const A = [O('c1', 'cone', 0, 0), O('c2', 'cone', 100, 0), O('h1', 'hoop', 0, 0)];
  const B = [O('d1', 'cone', 95, 0), O('d2', 'cone', 5, 0), O('m1', 'mat', 0, 0)];
  const d = { steps: [{ items: A }, { items: B }] };
  const { moves, gone, appear } = same(d, 0);
  assert.deepEqual(Object.fromEntries(moves.map(m => [m.b.id, m.a.id])), { d1: 'c2', d2: 'c1' });
  assert.deepEqual(gone.map(o => o.id), ['h1']);
  assert.deepEqual(appear.map(o => o.id), ['m1']);
});

test('文字需同 label 才配對', () => {
  const A = [O('t1', 'text', 0, 0, { label: 'X' })];
  const B = [O('t2', 'text', 0, 0, { label: 'Y' }), O('t3', 'text', 500, 0, { label: 'X' })];
  const d = { steps: [{ items: A }, { items: B }] };
  const { moves, appear } = same(d, 0);
  assert.equal(moves.length, 1);
  assert.equal(moves[0].b.id, 't3');
  assert.deepEqual(appear.map(o => o.id), ['t2']);
});

test('沿箭頭路徑：人走跑動線不走傳球線，球可走傳球線；門檻與最短距離', () => {
  const run = Ln('r', 'run', 110, 100, 300, 100), pass = Ln('s', 'pass', 100, 100, 300, 100), far = Ln('f', 'run', 160, 100, 300, 100);
  const A = [P('p', 'red', '1', 100, 100), O('b', 'ball', 100, 100), run, pass, far, Ln('z', 'zone', 100, 100, 300, 100)];
  const B = [P('p', 'red', '1', 310, 100), O('b', 'ball', 300, 120)];
  const d = { steps: [{ items: A }, { items: B }] };
  const { moves, linesOut } = same(d, 0);
  assert.equal(moves[0].path, run);
  assert.equal(moves[1].path, pass);
  assert.deepEqual(linesOut, [run, pass, far]);
  assert.equal(findPath(A[0], { x: 400, y: 100 }, [run]), null); // 終點超過 60
  assert.equal(findPath(A[0], B[0], [far]), null);               // 起點超過 45
  const mid = posAt(moves[0], 0.5);
  assert.deepEqual([mid.x, mid.y], [205, 100]);                   // 沿線中點 205，加上起點偏移 -10、終點偏移 +10 各半
});

test('區域：保留、淡出、淡入', () => {
  const z1 = Ln('z1', 'zone', 0, 0, 100, 100), z2 = Ln('z2', 'zone', 0, 0, 50, 50);
  const B = [{ ...z1, x2: 100.3 }, Ln('z3', 'zone', 1, 1, 2, 2)];
  const d = { steps: [{ items: [z1, z2] }, { items: B }] };
  const p = same(d, 0);
  assert.deepEqual([p.zonesKeep.map(z => z.id), p.zonesOut.map(z => z.id), p.zonesIn.map(z => z.id)], [['z1'], ['z2'], ['z3']]);
  assert.equal(sameZone(z1, { ...z1, x1: 0.6 }), false);
  assert.equal(by(B, p.zonesKeep[0]), 0);
});

test('posAt：旋轉走最短方向', () => {
  const m = { a: O('a', 'mat', 0, 0, { rot: 350 }), b: O('a', 'mat', 10, 20, { rot: 10 }), path: null };
  assert.deepEqual(posAt(m, 0.5), { ...m.b, x: 5, y: 10, rot: 360 });
  assert.deepEqual(posAt(m, 0.5), structuredClone(L.posAt(m, 0.5)));
});
