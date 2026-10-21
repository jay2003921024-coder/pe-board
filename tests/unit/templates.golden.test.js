// AC-8：8 個內建範本的內容與舊版相同（同一個亂數種子下連 id 都相同）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLegacy, withSeed } from '../helpers/legacy.js';
import { TEMPLATES, docFromTemplate, tplBuilder } from '../../js/core/templates.js';

const plain = v => structuredClone(v);

test('內建範本共 8 個，標題、年段、場地、順序相同', () => {
  const L = loadLegacy(['Courts', 'Objects', 'Templates']);
  assert.equal(TEMPLATES.length, 8);
  const meta = T => T.map(t => [t.title, t.grade, t.court]);
  assert.deepEqual(meta(TEMPLATES), plain(meta(L.TEMPLATES)));
});

for (const seed of [1, 42]) {
  test(`docFromTemplate：8 個範本逐一相同（種子 ${seed}，含 id）`, () => {
    const L = loadLegacy(['Courts', 'Objects', 'Templates'], { seed });
    const mine = withSeed(seed, () => TEMPLATES.map(t => docFromTemplate(t)));
    const old = plain(L.TEMPLATES.map(t => L.docFromTemplate(t)));
    assert.equal(mine.length, 8);
    for (let i = 0; i < 8; i++) assert.deepEqual(mine[i], old[i], TEMPLATES[i].title);
  });
}

test('tplBuilder 的座標換算與線條預設值相同', () => {
  for (const court of ['bb-half', 'soccer', 'pool']) {
    const L = loadLegacy(['Courts', 'Objects', 'Templates'], { seed: 3 });
    const build = b => [b.P(1.5, -2), b.pl('blue', 7, 3, 4), b.it('mat', 1, 1, { rot: 90 }), b.ball(2, 2), b.ln('run', [0, 0], [5, 5]), b.ln('pass', [0, 0], [5, 5], [1, 4], { color: '#fff' })];
    assert.deepEqual(withSeed(3, () => build(tplBuilder(court))), plain(build(L.tplBuilder(court))));
  }
});
