// AC-5：exportSVG（目前步驟／全部步驟＋說明）與舊版逐字相同。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLegacy } from '../helpers/legacy.js';
import { wrapText, exportSVG } from '../../js/core/exportsvg.js';

// 舊版 exportSVG 讀閉包外的全域 doc：每次比對前以 L.doc = d 注入。
const L = loadLegacy(['Courts', 'Objects', 'Rendering', 'Export'], { globals: { ui: { team: 'red' } } });
const T = loadLegacy(['Courts', 'Objects', 'Templates'], { seed: 9 });
const docs = structuredClone(T.TEMPLATES.map(t => T.docFromTemplate(t)));
const same = (d, indices, withNotes) => { L.doc = d; assert.equal(exportSVG(d, indices, withNotes), L.exportSVG(indices, withNotes)); };

test('wrapText 與舊版相同', () => {
  const cases = ['', null, undefined, 'abc', '中文'.repeat(40), 'a'.repeat(200), 'mixed 中英 text '.repeat(10), '第一行\n\n第三行\n', '\n開頭換行', '結尾換行\n\n', 'é€ÿĀ'.repeat(30), 12345];
  for (const s of cases) for (const max of [5, 56, 62]) assert.deepEqual(wrapText(s, max), structuredClone(L.wrapText(s, max)), `${s} / ${max}`);
});

docs.forEach((d, n) => {
  test(`範本 ${n + 1}「${d.title}」：每個單步、全部＋說明、全部不含說明逐字相同`, () => {
    d.steps.forEach((_, i) => { same(d, [i], false); same(d, [i], true); });
    const all = d.steps.map((_, i) => i);
    same(d, all, true);
    same(d, all, false);
  });
});

test('邊界：空標題與欄位、單步無名稱、單步有名稱、長說明、特殊字元、iconScale', () => {
  const base = docs[0];
  const variants = [
    { ...base, title: '', grade: '', players: '', equipment: '', duration: '' },
    { ...base, title: '<教案> & "測試"', players: '很多人'.repeat(30), iconScale: 1.4 },
    { ...base, steps: [{ ...base.steps[0], name: '' }] },
    { ...base, steps: [{ ...base.steps[0], name: '唯一步驟', note: '' }] },
    { ...base, steps: base.steps.map(s => ({ ...s, name: '', note: `${s.note}\n\n第二段 <b>&amp;</b>\n${'x'.repeat(130)}` })) },
    { ...docs[3], court: 'track', iconScale: 0.8 },
  ];
  for (const d of variants) {
    const all = d.steps.map((_, i) => i);
    same(d, [0], false); same(d, all, true); same(d, all, false);
  }
});
