// AC-1、AC-2：場地、物件、線條、工具圖示的 SVG 與舊版逐字相同。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLegacy } from '../helpers/legacy.js';
import * as util from '../../js/core/util.js';
import { COURTS, scaleOf, courtH, courtSVG } from '../../js/core/courts.js';
import { TEAMS, INKS, ITEMS, LINES, isLine, textHalfW, clampSize, selR, TEXT_MIN, TEXT_MAX } from '../../js/core/items.js';
import { boardContent, itemSVG, lineSVG, iconSVG, qpt, qder } from '../../js/core/render.js';

const env = { ui: { team: 'red' }, doc: { court: 'bb-half' } };
const L = loadLegacy(['Courts', 'Objects', 'Rendering'], { globals: env });
const courtIds = Object.keys(COURTS);
// vm 內建立的物件原型屬於另一個 realm，深比較前先複製到這個 realm。
const plain = v => structuredClone(v);

test('前導常數相同', () => {
  assert.equal(util.W, L.W);
  assert.equal(util.FONT, L.FONT);
  for (const v of [0, 1.04, 1.05, -2.35, 123.456, 1e-9]) assert.equal(util.f(v), L.f(v));
  for (const s of ['a<b>&"c\'', null, undefined, 3]) assert.equal(util.esc(s), L.esc(s));
});

test('14 種場地：id、名稱、分組、順序與舊版相同', () => {
  assert.equal(courtIds.length, 14);
  assert.deepEqual(courtIds, Object.keys(L.COURTS));
  const meta = C => Object.values(C).map(c => [c.name, c.group, c.L, c.B, c.m, c.bg, c.ball]);
  assert.deepEqual(meta(COURTS), meta(L.COURTS));
});

for (const id of courtIds) {
  test(`場地 ${id}：courtSVG、scaleOf、courtH 逐字相同`, () => {
    assert.equal(scaleOf(id), L.scaleOf(id));
    assert.equal(courtH(id), L.courtH(id));
    assert.equal(courtSVG(id), L.courtSVG(id));
  });
}

test('物件與線條定義相同', () => {
  assert.deepEqual(TEAMS, plain(L.TEAMS));
  assert.deepEqual(INKS, plain(L.INKS));
  assert.deepEqual(ITEMS, plain(L.ITEMS));
  assert.deepEqual(LINES, plain(L.LINES));
  assert.equal(TEXT_MIN, L.TEXT_MIN);
  assert.equal(TEXT_MAX, L.TEXT_MAX);
  for (const v of [-5, 7.4, 8, 50.5, 119.6, 500]) assert.equal(clampSize(v), L.clampSize(v));
});

// 涵蓋每種物件／線條及其變化：五色學生 × 0–3 字元編號、文字白/黑/預設與特殊字元、區域有無名稱、運球長短、曲線/直線。
let n = 0;
const id = () => `o${++n}`;
const fixture = [];
for (const team of [...Object.keys(TEAMS), 'unknown']) {
  for (const label of [undefined, '', '7', '12', '王小明', 3]) fixture.push({ id: id(), type: 'player', team, label, x: 100.04 + n, y: 200.06 });
}
fixture.push({ id: id(), type: 'teacher', x: 300, y: 120.55 });
for (const type of ['cone', 'disc', 'hoop', 'kick']) fixture.push({ id: id(), type, x: 50 + n * 3.3, y: 77.77 });
fixture.push({ id: id(), type: 'ball', x: 10, y: 20 }, { id: id(), type: 'ball', color: '#f3d34a', x: 11.11, y: 22.22 });
for (const type of ['hurdle', 'ladder', 'goal', 'mat', 'kick']) {
  for (const rot of [undefined, 0, 45, 270]) fixture.push({ id: id(), type, rot, x: 400, y: 300 });
}
fixture.push({ id: id(), type: 'mat', label: '<跳箱>&"', x: 1, y: 2 });
for (const color of [undefined, '#141414', '#ffffff', '#FFFFFF', '#d6332b']) {
  for (const label of [undefined, '', 'Aa', '集合 A&B', '<script>']) fixture.push({ id: id(), type: 'text', color, label, size: n % 3 ? 18 + n : undefined, x: 500, y: 250 });
}
const line = (type, x1, y1, x2, y2, cx, cy, extra = {}) => ({ id: id(), type, x1, y1, x2, y2, cx: cx ?? (x1 + x2) / 2, cy: cy ?? (y1 + y2) / 2, ...extra });
for (const type of ['run', 'pass', 'dribble']) {
  for (const color of [undefined, '#ffffff', '#1f5fbf']) {
    fixture.push(
      line(type, 100, 100, 400, 300, undefined, undefined, { color }),       // 直線
      line(type, 100.33, 100, 400, 300, 380, 60.07, { color }),             // 曲線
      line(type, 10, 10, 10.4, 10.2),                                       // 幾乎零長度（箭頭方向退回端點差）
      line(type, 200, 200, 200, 200),                                       // 零長度
      line(type, 50, 50, 70, 55),                                           // 短
      line(type, 0, 0, 900, 600, 900, 0),                                   // 長
    );
  }
}
for (const color of [undefined, '#ffffff', '#f2c230']) {
  for (const label of [undefined, '', '安全區 <1>']) fixture.push(line('zone', 600, 400, 200.25, 150, undefined, undefined, { color, label }));
}

test('fixture 涵蓋所有 ITEMS 與 LINES 類型', () => {
  const types = new Set(fixture.map(o => o.type));
  for (const t of [...Object.keys(ITEMS), ...Object.keys(LINES)]) assert.ok(types.has(t), t);
});

test('每個物件／線條單獨：itemSVG、lineSVG、selR、textHalfW、isLine 相同', () => {
  for (const o of fixture) {
    assert.equal(Boolean(isLine(o)), Boolean(L.isLine(o)), o.id);
    for (const hit of [true, false]) {
      if (isLine(o)) assert.equal(lineSVG(o, hit), L.lineSVG(o, hit), `${o.id} ${o.type} hit=${hit}`);
      else for (const k of [1, 1.4, 0.6]) assert.equal(itemSVG(o, k, hit), L.itemSVG(o, k, hit), `${o.id} ${o.type} k=${k} hit=${hit}`);
    }
    if (!isLine(o)) assert.equal(selR(o), L.selR(o), o.id);
    if (o.type === 'text') assert.equal(textHalfW(o), L.textHalfW(o), o.id);
  }
  for (const t of [0, 0.25, 0.5, 1]) {
    const l = fixture.find(o => o.type === 'run' && o.cy === 60.07);
    assert.deepEqual(qpt(t, l), plain(L.qpt(t, l)));
    assert.deepEqual(qder(t, l), plain(L.qder(t, l)));
  }
});

test('boardContent：每種場地 × k=1/1.4 × hit=true/false 逐字相同', () => {
  const step = { name: '測試', note: '', items: fixture };
  for (const court of courtIds) {
    for (const k of [1, 1.4]) {
      for (const hit of [true, false]) assert.equal(boardContent(court, step, k, hit), L.boardContent(court, step, k, hit), `${court} k=${k} hit=${hit}`);
    }
  }
  assert.equal(boardContent('gym', { items: [] }, 1, false), L.boardContent('gym', { items: [] }, 1, false));
});

test('iconSVG：每種類型 × 每個隊伍顏色 × 每種場地的球色 相同', () => {
  for (const type of [...Object.keys(ITEMS), ...Object.keys(LINES)]) {
    for (const team of Object.keys(TEAMS)) {
      for (const court of courtIds) {
        env.ui.team = team; env.doc.court = court;
        assert.equal(iconSVG(type, { team, ballColor: COURTS[court].ball }), L.iconSVG(type), `${type} ${team} ${court}`);
      }
    }
  }
});
