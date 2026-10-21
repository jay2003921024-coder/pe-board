// AC-6、AC-13：教案資料正規化（含舊版資料）、讀回 pe-board-v1、物件位移、學生自動編號。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLegacy, withSeed } from '../helpers/legacy.js';
import { normalizeDoc, tplFromDoc, parseSavedDoc, shiftObj, nextLabel } from '../../js/core/doc.js';
import { TEMPLATES, docFromTemplate } from '../../js/core/templates.js';

const SEED = 21;
// 每次比對都重新載入舊版，讓兩邊的固定種子亂數序列從同一點開始。
const fresh = () => loadLegacy(['Courts', 'Objects'], { seed: SEED, snippets: ['normalizeDoc', 'tplFromDoc'] });

// 舊版寫進 pe-board-v1 的教案（含 cur、srcTpl、各種殘缺）。
const legacyDoc = {
  title: '三人傳切上籃', grade: '國中', court: 'bb-half', players: '3 人', equipment: 7, duration: null,
  iconScale: '1.4', cur: 1, srcTpl: 'tabc123',
  steps: [
    { id: 's1', name: '第一步', note: '說明', items: [
      { id: 'a', type: 'player', team: 'red', label: '1', x: 10, y: 20 },
      { id: 'b', type: 'rocket', x: 1, y: 1 },                       // 未知類型
      null,                                                           // 壞項目
      { id: 'c', type: 'run', x1: 0, y1: 0, x2: 10, y2: 10, cx: 5, cy: 5 },
      { id: 'd', type: 'zone', x1: 0, y1: 0, x2: 10, y2: 10, cx: 5, cy: 5, label: '區' },
      { id: 'e', type: 'text', label: '集合', x: 3, y: 4, size: 20, color: '#141414' },
    ] },
    { name: null, items: 'oops' },                                    // 缺 id／note、items 不是陣列
    { id: 's3' },
  ],
};
const messy = [
  legacyDoc,
  { ...legacyDoc, court: 'no-such-court' },
  { ...legacyDoc, steps: [] },
  { ...legacyDoc, steps: 'x' },
  { title: 5, grade: '', iconScale: 0 },
  {},
  null,
  undefined,
  { court: 'pool', steps: [{ id: 'only', name: 'n', note: 'm', items: [] }], extra: { keep: true } },
];

test('normalizeDoc：舊版各種資料的結果與舊版相同', () => {
  for (const d of messy) {
    const mine = withSeed(SEED, () => normalizeDoc(d));
    assert.deepEqual(mine, structuredClone(fresh().normalizeDoc(d)), JSON.stringify(d));
  }
});

test('normalizeDoc：具體規則', () => {
  const n = normalizeDoc(legacyDoc);
  assert.equal(n.court, 'bb-half');
  assert.equal(n.cur, 0);
  assert.equal(n.iconScale, 1.4);
  assert.equal('srcTpl' in n, false);
  assert.equal(n.equipment, '');
  assert.equal(n.duration, '');
  assert.deepEqual(n.steps[0].items.map(o => o.id), ['a', 'c', 'd', 'e']);
  assert.equal(n.steps[1].name, '');
  assert.equal(n.steps[1].note, '');
  assert.deepEqual(n.steps[1].items, []);
  assert.match(n.steps[1].id, /^[0-9a-z]+$/);
  assert.equal(normalizeDoc({ ...legacyDoc, court: 'nope' }).court, 'gym');
  const blank = normalizeDoc(null);
  assert.equal(blank.steps.length, 1);
  assert.deepEqual([blank.court, blank.grade, blank.title, blank.iconScale], ['gym', '國中', '', 1]);
  assert.deepEqual(normalizeDoc({ ...legacyDoc, extra: 1 }).extra, 1, '未知欄位保留（A9 新欄位只能新增）');
});

test('normalizeDoc 不修改輸入、可重複套用', () => {
  const before = JSON.stringify(legacyDoc);
  const once = normalizeDoc(legacyDoc);
  assert.equal(JSON.stringify(legacyDoc), before);
  assert.deepEqual(normalizeDoc(once), once);
});

test('normalizeDoc：內建範本不變（除了 cur）', () => {
  for (const t of TEMPLATES) { const d = docFromTemplate(t); assert.deepEqual(normalizeDoc(d), d); }
});

test('tplFromDoc 與舊版相同', () => {
  for (const d of messy) {
    for (const extra of [undefined, { name: '自訂' }, { folder: '球類', name: '' }]) {
      assert.deepEqual(withSeed(SEED, () => tplFromDoc(d, extra)), structuredClone(fresh().tplFromDoc(d, extra)));
    }
  }
  assert.equal(tplFromDoc({}).name, '未命名教案');
});

test('parseSavedDoc：合法的舊版 pe-board-v1 原樣採用（不正規化）', () => {
  const raw = JSON.stringify(legacyDoc);
  assert.deepEqual(parseSavedDoc(raw), legacyDoc);
});

const bad = [null, undefined, '', 'not json', '{', 'null', '42', '"str"', '[]', '{}', JSON.stringify({ ...legacyDoc, steps: [] }), JSON.stringify({ ...legacyDoc, steps: {} }), JSON.stringify({ ...legacyDoc, court: 'nope' }), JSON.stringify({ steps: [{}] })];

test('parseSavedDoc：損壞、空值、無步驟、不存在的場地回 null', () => {
  for (const raw of bad) assert.equal(parseSavedDoc(raw), null, String(raw));
});

test('parseSavedDoc 與舊版 State 段讀取 localStorage 的結果一致', () => {
  for (const raw of [JSON.stringify(legacyDoc), JSON.stringify({ court: 'pool', steps: [{ items: [] }] }), ...bad]) {
    const S = loadLegacy(['Courts', 'Objects', 'Templates', 'State'], { globals: { localStorage: { getItem: () => raw } } });
    const got = parseSavedDoc(raw);
    if (got) assert.deepEqual(structuredClone(S.doc), got);
    else assert.equal(S.doc.title, TEMPLATES[0].title, `${raw} 應退回第一個內建範本`);
  }
});

test('shiftObj：物件移動 x/y，線條移動兩端與控制點', () => {
  const o = { type: 'cone', x: 1, y: 2 };
  shiftObj(o, 3, -1);
  assert.deepEqual(o, { type: 'cone', x: 4, y: 1 });
  const l = { type: 'pass', x1: 0, y1: 0, x2: 10, y2: 10, cx: 5, cy: 6 };
  shiftObj(l, 1, 2);
  assert.deepEqual(l, { type: 'pass', x1: 1, y1: 2, x2: 11, y2: 12, cx: 6, cy: 8 });
  const S = loadLegacy(['Courts', 'Objects', 'Templates', 'State'], { globals: { localStorage: { getItem: () => null } } });
  const z = { type: 'zone', x1: 0, y1: 0, x2: 10, y2: 10, cx: 5, cy: 5 }, z2 = structuredClone(z);
  shiftObj(z, 2.5, 3); S.shiftObj(z2, 2.5, 3);
  assert.deepEqual(z, z2);
});

test('nextLabel：同隊最大數字＋1，忽略非數字與其他隊', () => {
  const items = [
    { type: 'player', team: 'red', label: '3' }, { type: 'player', team: 'red', label: '10' }, { type: 'player', team: 'red', label: 'A' },
    { type: 'player', team: 'red', label: '7a' }, { type: 'player', team: 'blue', label: '20' }, { type: 'text', team: 'red', label: '99' },
  ];
  assert.equal(nextLabel(items, 'red'), '11');
  assert.equal(nextLabel(items, 'blue'), '21');
  assert.equal(nextLabel(items, 'green'), '1');
  assert.equal(nextLabel([], 'red'), '1');
  assert.equal(nextLabel([{ type: 'player', team: 'red', label: 'GK' }], 'red'), '1');
});
