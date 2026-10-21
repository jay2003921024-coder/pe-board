// 從 legacy/pe-board.html 切出舊版程式碼段落，在 node:vm 中執行，當 golden test 的參考答案。
// 段落以舊版的註解標記 `/* ---------- 名稱 ---------- */` 切分；`(() => {` 與第一個標記之間的
// 前導段（W、FONT、$、uid、f、esc）一律先執行。
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const LEGACY = new URL('../../legacy/pe-board.html', import.meta.url);
const MARKER = /^\/\* -{10} (.+?) -{10} \*\/$/gm;

let parsed;
function parse() {
  if (parsed) return parsed;
  const html = readFileSync(LEGACY, 'utf8');
  const open = html.indexOf('<script>\n(() => {\n');
  if (open < 0) throw new Error('legacy.js：找不到舊版 <script> 內的 `(() => {` 起點');
  const start = open + '<script>\n(() => {\n'.length;
  const end = html.lastIndexOf('})();\n</script>');
  if (end < start) throw new Error('legacy.js：找不到舊版 <script> 結尾的 `})();`');
  const body = html.slice(start, end);
  const marks = [...body.matchAll(MARKER)];
  if (!marks.length) throw new Error('legacy.js：舊版程式碼中找不到任何段落標記');
  const sections = {};
  marks.forEach((m, i) => {
    const name = m[1].replace(/\s*\(.*\)$/, '');
    sections[name] = body.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : body.length);
  });
  parsed = { preamble: body.slice(0, marks[0].index), sections };
  return parsed;
}

export const sectionNames = () => Object.keys(parse().sections);

// 固定種子的亂數（mulberry32），讓 uid() 可重現。
export function seededRandom(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 執行前導段與指定段落，回傳一個物件：讀取屬性即取得舊版閉包中的同名常數或函式。
 * @param {string[]} names 段落名稱，例如 ['Courts', 'Objects']（括號說明不用寫）
 * @param {object} [opts]
 * @param {object} [opts.globals] 注入 vm 全域的最小假環境，例如 { ui: { team }, doc: { court } }
 * @param {number} [opts.seed] 給 Math.random 的固定種子
 */
export function loadLegacy(names, { globals = {}, seed = 1 } = {}) {
  const { preamble, sections } = parse();
  const code = names.map(n => {
    if (!(n in sections)) throw new Error(`legacy.js：找不到段落「${n}」，現有段落：${Object.keys(sections).join('、')}`);
    return sections[n];
  });
  const math = Object.create(Math);
  math.random = seededRandom(seed);
  // 前導段的 `$` 只在呼叫時才碰 document；Rendering 段開頭的 $('#board') 需要一個能回傳東西的 querySelector。
  const context = vm.createContext({ document: { querySelector: () => ({}) }, ...globals, Math: math });
  const get = vm.runInContext(`(function () {\n${preamble}\n${code.join('\n')}\nreturn name => eval(name);\n})()`, context, { filename: 'legacy/pe-board.html' });
  return new Proxy({}, {
    get: (_, key) => {
      if (typeof key !== 'string') return undefined;
      try { return get(key); } catch (e) { throw new Error(`legacy.js：舊版段落 ${names.join('、')} 中沒有「${key}」（${e.message}）`); }
    },
  });
}
