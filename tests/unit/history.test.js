// AC-13：復原／重做（行為同舊版 pushUndo／doUndo／doRedo）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHistory } from '../../js/core/history.js';

// 模擬舊版的使用方式：修改前 push(目前)，再改 doc。
function editor() {
  const h = createHistory();
  let doc = 'v0';
  return {
    h, get doc() { return doc; },
    edit(v) { h.push(doc); doc = v; },
    undo() { const s = h.undo(doc); if (s !== null) doc = s; },
    redo() { const s = h.redo(doc); if (s !== null) doc = s; },
  };
}

test('初始不能復原也不能重做；空堆疊時回 null', () => {
  const h = createHistory();
  assert.equal(h.canUndo(), false);
  assert.equal(h.canRedo(), false);
  assert.equal(h.undo('x'), null);
  assert.equal(h.redo('x'), null);
  assert.equal(h.canRedo(), false, '空堆疊復原不應把目前狀態推進重做');
});

test('push／undo／redo 依序還原', () => {
  const e = editor();
  e.edit('v1'); e.edit('v2'); e.edit('v3');
  e.undo(); assert.equal(e.doc, 'v2');
  e.undo(); assert.equal(e.doc, 'v1');
  assert.ok(e.h.canRedo());
  e.redo(); assert.equal(e.doc, 'v2');
  e.redo(); assert.equal(e.doc, 'v3');
  assert.equal(e.h.canRedo(), false);
  e.undo(); e.undo(); e.undo(); assert.equal(e.doc, 'v0');
  assert.equal(e.h.canUndo(), false);
  e.undo(); assert.equal(e.doc, 'v0');
});

test('push 後清空重做', () => {
  const e = editor();
  e.edit('v1'); e.edit('v2'); e.undo();
  assert.ok(e.h.canRedo());
  e.edit('v9');
  assert.equal(e.h.canRedo(), false);
  e.undo(); assert.equal(e.doc, 'v1');
});

test('上限 80 筆：超過時丟掉最舊的', () => {
  const e = editor();
  for (let i = 1; i <= 100; i++) e.edit('v' + i);
  let n = 0;
  while (e.h.canUndo()) { e.undo(); n++; }
  assert.equal(n, 80);
  assert.equal(e.doc, 'v20');
  for (let i = 0; i < 80; i++) e.redo();
  assert.equal(e.doc, 'v100');
});

test('limit 可設定', () => {
  const h = createHistory({ limit: 2 });
  h.push('a'); h.push('b'); h.push('c');
  assert.equal(h.undo('d'), 'c');
  assert.equal(h.undo('c'), 'b');
  assert.equal(h.undo('b'), null);
});

test('popLast 取消最後一筆 push（太短的線被丟掉）', () => {
  const e = editor();
  e.edit('v1');
  e.h.push(e.doc); // 開始畫線前 push，結果線太短
  e.h.popLast();
  e.undo(); assert.equal(e.doc, 'v0');
  assert.equal(e.h.canUndo(), false);
});

test('clear 清空兩個堆疊', () => {
  const e = editor();
  e.edit('v1'); e.edit('v2'); e.undo();
  e.h.clear();
  assert.equal(e.h.canUndo(), false);
  assert.equal(e.h.canRedo(), false);
});
