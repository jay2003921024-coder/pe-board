// AC-12：每檔 ≤ 400 行；js/core 不碰 DOM／瀏覽器全域。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripCode } from '../helpers/strip.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MAX_LINES = 400;
const FORBIDDEN = /\b(document|window|localStorage|navigator)\b/;

function walk(dir, ext) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true }).filter(p => p.endsWith(ext)).map(p => join(abs, p));
}
const lineCount = s => s.split('\n').length - (s.endsWith('\n') ? 1 : 0);

test(`js/ 與 css/ 每個檔案不超過 ${MAX_LINES} 行`, () => {
  const files = [...walk('js', '.js'), ...walk('css', '.css')];
  assert.ok(files.length > 0, '應該至少掃到一個檔案');
  const over = files.map(p => [relative(ROOT, p), lineCount(readFileSync(p, 'utf8'))]).filter(([, n]) => n > MAX_LINES);
  assert.deepEqual(over, [], `超過 ${MAX_LINES} 行：${over.map(([p, n]) => `${p}（${n} 行）`).join('、')}`);
});

test('js/core 不使用 document、window、localStorage、navigator', () => {
  const bad = [];
  for (const p of walk('js/core', '.js')) {
    stripCode(readFileSync(p, 'utf8')).split('\n').forEach((ln, i) => {
      const m = ln.match(FORBIDDEN);
      if (m) bad.push(`${relative(ROOT, p)}:${i + 1}（${m[1]}）`);
    });
  }
  assert.deepEqual(bad, []);
});

test('stripCode：註解、字串、樣板字串文字與正規表示式中的字眼不算違規', () => {
  const src = [
    '// document.querySelector 只是註解',
    '/* window.open',
    '   localStorage */',
    "const a = 'navigator', b = \"document\", c = `window ${1 + 2} localStorage`;",
    'const r = /document|window/g, d = 4 / 2 / 1;',
    'const t = `a ${`window`} b`;',
  ].join('\n');
  const out = stripCode(src);
  assert.doesNotMatch(out, FORBIDDEN);
  assert.equal(out.split('\n').length, 6, '行數不變');
  assert.match(out, /4 \/ 2 \/ 1/, '除號不能被當成正規表示式');
});

test('stripCode：真的程式碼仍會被抓到', () => {
  for (const src of [
    'const el = document.querySelector("#a");',
    'const t = `x ${window.innerWidth} y`;',
    "if (x) localStorage.setItem('k', v); // 註解",
    'const n = a / b; navigator.clipboard;',
  ]) assert.match(stripCode(src), FORBIDDEN, src);
});
