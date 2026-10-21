// AC-6、AC-7、AC-13：範本檔匯入／匯出、本機範本庫 pe-board-mytpl-v1 解析。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadLegacy } from '../helpers/legacy.js';
import { serializeTemplates, parseTemplateFile, parseLocalLib, allFolders } from '../../js/core/tplfile.js';
import { tplFromDoc } from '../../js/core/doc.js';
import { COURTS } from '../../js/core/courts.js';

// 由 tests/fixtures/make-legacy-export.js 以舊版程式碼產生。
const FIXTURE = readFileSync(new URL('../fixtures/legacy-export.json', import.meta.url), 'utf8');
const L = loadLegacy(['Courts', 'Objects', 'Templates'], { snippets: ['normalizeDoc', 'tplFromDoc'] });

test('舊版匯出檔：解析出全部 8 個範本，名稱、資料夾、內容正確', () => {
  const list = parseTemplateFile(FIXTURE);
  assert.equal(list.length, 8);
  assert.deepEqual(list.map(t => t.name), structuredClone(L.TEMPLATES.map(t => t.title)));
  assert.deepEqual(list.map(t => t.folder), ['球類', '', '球類', '田徑與游泳', '球類', '', '', '田徑與游泳']);
  const raw = JSON.parse(FIXTURE).templates;
  list.forEach((t, i) => {
    assert.ok(COURTS[t.doc.court]);
    assert.ok(t.doc.steps.length >= 1);
    assert.deepEqual(t.doc, raw[i].doc, '舊版匯出的 doc 已正規化，解析後不變');
    // 與舊版匯入流程（tplFromDoc(x.doc, { name })）產生的 doc 相同
    assert.deepEqual(t.doc, structuredClone(L.tplFromDoc(raw[i].doc, { name: t.name }).doc));
  });
});

test('serializeTemplates 與舊版匯出的字串逐字相同', () => {
  const data = JSON.parse(FIXTURE);
  const mine = data.templates.map((t, i) => ({ ...t, id: 't' + i, kind: 'tpl' }));
  assert.equal(serializeTemplates(mine, data.exportedAt), FIXTURE);
});

test('serializeTemplates 預設帶目前時間', () => {
  const out = JSON.parse(serializeTemplates([]));
  assert.deepEqual([out.app, out.version, out.templates], ['pe-board', 1, []]);
  assert.ok(!Number.isNaN(Date.parse(out.exportedAt)));
});

test('新版匯出 → 新版匯入 往返相等', () => {
  const list = parseTemplateFile(FIXTURE);
  const mine = list.map((t, i) => ({ ...tplFromDoc(t.doc, { name: t.name }), id: 't' + i, folder: t.folder, kind: 'tpl', updatedAt: i }));
  const text = serializeTemplates(mine, '2026-10-21T00:00:00.000Z');
  assert.ok(!text.includes('"kind"') && !/"id": "t\d"/.test(text), '匯出不含 id、kind');
  assert.deepEqual(parseTemplateFile(text), list);
});

test('單一教案檔（舊版 doc JSON）也能匯入', () => {
  const doc = JSON.parse(FIXTURE).templates[3].doc;
  const [t, ...rest] = parseTemplateFile(JSON.stringify(doc));
  assert.equal(rest.length, 0);
  assert.equal(t.name, doc.title);
  assert.equal(t.folder, '');
  assert.deepEqual(t.doc, doc);
  assert.equal(parseTemplateFile(JSON.stringify({ ...doc, title: '' }))[0].name, '匯入的範本');
});

test('名稱與資料夾截 40 字；缺名稱用 doc.title；資料夾非字串視為未分類；缺 doc 得到空白教案', () => {
  const long = '長'.repeat(50);
  const list = parseTemplateFile(JSON.stringify({ templates: [
    { name: long, folder: long, doc: { title: 'x', court: 'pool', steps: [{ items: [] }] } },
    { doc: { title: '用標題' }, folder: 3 },
    { name: 7 },
  ] }));
  assert.deepEqual(list.map(t => [t.name, t.folder]), [['長'.repeat(40), '長'.repeat(40)], ['用標題', ''], ['7', '']]);
  assert.equal(list[2].doc.court, 'gym');
  assert.equal(list[2].doc.steps.length, 1);
});

test('格式錯誤 throw；找不到範本回空陣列', () => {
  for (const bad of ['', 'not json', '{', 'null', '42', '"str"', '{"templates":[null]}', '{"templates":[1]}']) {
    assert.throws(() => parseTemplateFile(bad), undefined, bad);
  }
  for (const empty of ['{"templates":[]}', '{}', '{"app":"pe-board","version":1}', '[]']) assert.deepEqual(parseTemplateFile(empty), [], empty);
});

test('parseLocalLib：讀舊版 pe-board-mytpl-v1', () => {
  const mine = JSON.parse(FIXTURE).templates.map((t, i) => ({ ...t, id: 't' + i, kind: 'tpl', updatedAt: 1 }));
  const raw = JSON.stringify({ mine, folders: ['球類', '空資料夾'] });
  assert.deepEqual(parseLocalLib(raw), { mine, folders: ['球類', '空資料夾'] });
});

test('parseLocalLib：壞資料回空陣列', () => {
  for (const raw of [null, undefined, '', 'garbage', 'null', '42', '{"mine":3,"folders":"x"}', '{}']) {
    assert.deepEqual(parseLocalLib(raw), { mine: [], folders: [] }, String(raw));
  }
  assert.deepEqual(parseLocalLib('{"mine":[{"id":"t1"}]}'), { mine: [{ id: 't1' }], folders: [] });
});

test('allFolders：資料夾清單與範本用到的資料夾聯集、去重、依中文排序', () => {
  const mine = [{ folder: '球類' }, { folder: '' }, {}, { folder: '田徑' }, { folder: '球類' }];
  const got = allFolders(mine, ['游泳', '球類']);
  assert.deepEqual(got, [...new Set(['游泳', '球類', '田徑'])].sort((a, b) => a.localeCompare(b, 'zh-Hant')));
  assert.equal(got.length, 3);
  assert.deepEqual(allFolders([], []), []);
});
