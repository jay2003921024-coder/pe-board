// 去掉 JS 原始碼中的註解、字串、樣板字串的文字部分與正規表示式內容，只留下「程式碼」。
// 樣板字串中的 ${…} 是程式碼，保留。換行一律保留，讓行數不變。
const REGEX_PREV = new Set([...'(,=:[!&|?{};+-*%<>~^']);
const REGEX_KEYWORDS = /(?:^|[^\w$])(?:return|typeof|case|do|else|in|of|void|yield|await|delete|new)$/;

export function stripCode(src) {
  let out = '';
  let i = 0;
  const stack = []; // 'tpl' = 在樣板字串文字中；數字 = ${ } 內的大括號深度
  const keepNewlines = s => s.replace(/[^\n]/g, '');
  const prevSignificant = () => {
    const t = out.replace(/\s+$/, '');
    return { ch: t.slice(-1), text: t };
  };
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (stack.at(-1) === 'tpl') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); out += '`'; i++; continue; }
      if (c === '$' && n === '{') { stack.push(0); out += '${'; i += 2; continue; }
      if (c === '\n') out += '\n';
      i++; continue;
    }
    if (c === '/' && n === '/') { const e = src.indexOf('\n', i); i = e < 0 ? src.length : e; continue; }
    if (c === '/' && n === '*') {
      const e = src.indexOf('*/', i + 2), end = e < 0 ? src.length : e + 2;
      out += keepNewlines(src.slice(i, end)); i = end; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      out += c + c; i = j + 1; continue;
    }
    if (c === '`') { stack.push('tpl'); out += '`'; i++; continue; }
    if (c === '/') {
      const { ch, text } = prevSignificant();
      if (ch === '' || REGEX_PREV.has(ch) || REGEX_KEYWORDS.test(text)) {
        let j = i + 1, cls = false;
        while (j < src.length && src[j] !== '\n') {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '[') cls = true;
          else if (src[j] === ']') cls = false;
          else if (src[j] === '/' && !cls) break;
          j++;
        }
        out += '//'; i = j + 1; continue;
      }
    }
    if (typeof stack.at(-1) === 'number') {
      if (c === '{') stack[stack.length - 1]++;
      else if (c === '}') {
        if (stack.at(-1) === 0) { stack.pop(); out += '}'; i++; continue; }
        stack[stack.length - 1]--;
      }
    }
    out += c; i++;
  }
  return out;
}
