// js/core/share.js：共享紀錄建立/讀回、搜尋篩選、首次登入上傳計畫、資料夾合併、管理員判斷、錯誤分類。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DOC_JSON_MAX, sharedContent, toSharedRecord, fromSharedRecord, toMineRecord, fromMineRecord,
  filterShared, planFirstUpload, planFolderMerge, isAdmin, toCloudFailure, validDocId,
} from '../../js/core/share.js';

const doc = (o = {}) => ({ title: '傳切', court: 'bb-half', grade: '國小高年級', steps: [{ id: 's1', name: '', note: '', items: [] }, { id: 's2', name: '', note: '', items: [] }], cur: 1, srcTpl: 3, ...o });
const tpl = (o = {}) => ({ id: 't1', kind: 'tpl', name: ' 三人傳切 ', folder: '球類', updatedAt: 123, doc: doc(), ...o });

test('toSharedRecord：欄位、正規化後的 docJson、作者', () => {
  const r = toSharedRecord(tpl(), { uid: 'u1', name: 'Alice', email: 'a@x.tw' });
  assert.deepEqual(Object.keys(r).sort(), ['authorName', 'authorUid', 'court', 'docJson', 'grade', 'name', 'steps']);
  assert.equal(r.name, '三人傳切'); assert.equal(r.court, 'bb-half'); assert.equal(r.grade, '國小高年級'); assert.equal(r.steps, 2);
  assert.equal(r.authorUid, 'u1'); assert.equal(r.authorName, 'Alice');
  const d = JSON.parse(r.docJson);
  assert.equal(d.cur, 0); assert.equal('srcTpl' in d, false);
});

test('toSharedRecord：名稱截到 40 字、空名稱與無名作者有預設值、壞場地改 gym', () => {
  const r = toSharedRecord(tpl({ name: 'x'.repeat(60), doc: doc({ court: 'nope' }) }), { uid: 'u', name: '' });
  assert.equal(r.name.length, 40); assert.equal(r.court, 'gym'); assert.equal(r.authorName, '老師');
  assert.equal(toSharedRecord(tpl({ name: '', doc: doc({ title: '' }) }), { uid: 'u' }).name, '未命名教案');
  assert.equal(toSharedRecord(tpl({ name: '' }), { uid: 'u' }).name, '傳切', '沒有範本名稱時用教案標題');
});

test('sharedContent：docJson 超過上限 throw too-large', () => {
  const big = doc({ steps: [{ id: 's', name: '', note: 'x'.repeat(DOC_JSON_MAX), items: [] }] });
  assert.throws(() => sharedContent(tpl({ doc: big })), e => e.code === 'too-large');
  assert.deepEqual(toCloudFailure((() => { try { sharedContent(tpl({ doc: big })); } catch (e) { return e; } })()), { error: 'too-large' });
});

test('fromSharedRecord：往返、時間戳記轉毫秒、壞資料丟掉', () => {
  const rec = { id: 'abc', ...toSharedRecord(tpl(), { uid: 'u1', name: 'Alice' }), createdAt: { toMillis: () => 1000 }, updatedAt: 2000 };
  const t = fromSharedRecord(rec);
  assert.equal(t.id, 'abc'); assert.equal(t.name, '三人傳切'); assert.equal(t.authorName, 'Alice'); assert.equal(t.authorUid, 'u1');
  assert.equal(t.createdAt, 1000); assert.equal(t.updatedAt, 2000);
  assert.equal(t.doc.court, 'bb-half'); assert.equal(t.doc.steps.length, 2); assert.equal(t.steps, 2);
  assert.equal(fromSharedRecord({ ...rec, createdAt: null }).createdAt, 0);
  for (const bad of [null, {}, { ...rec, id: 1 }, { ...rec, name: 5 }, { ...rec, docJson: '{壞' }, { ...rec, docJson: '[1]' }, { ...rec, docJson: 'null' }, { ...rec, docJson: undefined }])
    assert.equal(fromSharedRecord(bad), null, JSON.stringify(bad));
});

test('fromSharedRecord：場地以 docJson 為準（紀錄欄位被竄改也不影響）', () => {
  const rec = { id: 'a', ...toSharedRecord(tpl(), { uid: 'u' }), court: 'pool' };
  assert.equal(fromSharedRecord(rec).court, 'bb-half');
});

test('toMineRecord／fromMineRecord：欄位與本機範本相同、往返', () => {
  const r = toMineRecord(tpl());
  assert.deepEqual(Object.keys(r).sort(), ['court', 'docJson', 'folder', 'grade', 'name', 'steps', 'updatedAt']);
  assert.equal(r.folder, '球類'); assert.equal(r.updatedAt, 123);
  assert.equal(toMineRecord(tpl({ folder: undefined, updatedAt: undefined })).folder, '');
  assert.equal(toMineRecord(tpl({ updatedAt: undefined })).updatedAt, 0);
  const back = fromMineRecord({ id: 't1', ...r });
  assert.equal(back.id, 't1'); assert.equal(back.kind, 'tpl'); assert.equal(back.name, '三人傳切'); assert.equal(back.folder, '球類');
  assert.equal(back.updatedAt, 123); assert.equal(back.doc.title, '傳切'); assert.equal(back.steps, 2);
  assert.equal(fromMineRecord({ id: 't1', ...r, docJson: 'x' }), null);
  assert.equal(fromMineRecord(null), null);
});

test('filterShared：名稱不分大小寫、場地篩選', () => {
  const list = [{ name: 'Basketball 傳切', court: 'bb-half' }, { name: '排球接發', court: 'volleyball' }, { name: 'basket 上籃', court: 'bb-full' }, { court: 'gym' }];
  assert.deepEqual(filterShared(list, { q: 'BASKET' }).map(t => t.name), ['Basketball 傳切', 'basket 上籃']);
  assert.deepEqual(filterShared(list, { q: ' 排球 ' }).map(t => t.court), ['volleyball']);
  assert.deepEqual(filterShared(list, { q: 'basket', court: 'bb-full' }).map(t => t.name), ['basket 上籃']);
  assert.equal(filterShared(list, {}).length, 4);
  assert.equal(filterShared(list).length, 4);
});

test('planFirstUpload：只上傳雲端沒有的、以 id 去重、不合法 id 給新 id', () => {
  const local = [{ id: 'ta', name: 'A' }, { id: 'tb', name: 'B' }, { id: 'tb', name: 'B2' }, { id: 'tc', name: 'C' }, null, { name: '無 id' }, { id: 'a/b', name: '斜線' }];
  const plan = planFirstUpload(local, [{ id: 'ta' }, { id: 'tc' }]);
  assert.deepEqual(plan.slice(0, 1).map(t => t.name), ['B']);
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.slice(1).map(t => t.name), ['無 id', '斜線']);
  assert.ok(plan.every(t => validDocId(t.id)));
  assert.deepEqual(planFirstUpload([], [{ id: 'x' }]), []);
  assert.deepEqual(planFirstUpload([{ id: 'x' }], []).map(t => t.id), ['x']);
  assert.deepEqual(planFirstUpload(undefined, undefined), []);
  assert.deepEqual(planFirstUpload([{ id: 'ta' }], [{ id: 'ta' }]), [], '重複執行不會重複上傳');
});

test('planFolderMerge：兩台裝置資料夾不同時都保留，雲端順序在前', () => {
  assert.deepEqual(planFolderMerge(['田徑', '球類'], ['球類', '游泳']), { merged: ['球類', '游泳', '田徑'], changed: true });
});

test('planFolderMerge：重複不重複、相同時 changed 為 false', () => {
  assert.deepEqual(planFolderMerge(['球類', '球類', ''], ['球類']), { merged: ['球類'], changed: false });
  assert.deepEqual(planFolderMerge(['b', 'a'], ['a', 'b']), { merged: ['a', 'b'], changed: false });
});

test('planFolderMerge：雲端為空、本機為空、資料不是陣列', () => {
  assert.deepEqual(planFolderMerge(['a', 'b'], []), { merged: ['a', 'b'], changed: true });
  assert.deepEqual(planFolderMerge(['a'], undefined), { merged: ['a'], changed: true });
  assert.deepEqual(planFolderMerge([], ['a', 'b']), { merged: ['a', 'b'], changed: false });
  assert.deepEqual(planFolderMerge(null, ['a', 3, null]), { merged: ['a'], changed: true });
  assert.deepEqual(planFolderMerge([], []), { merged: [], changed: false });
});

test('planFolderMerge：removed（刪除、改名舊名）會從結果拿掉', () => {
  assert.deepEqual(planFolderMerge(['田徑'], ['球類', '田徑'], ['球類']), { merged: ['田徑'], changed: true });
  assert.deepEqual(planFolderMerge(['球類二'], ['球類', '田徑'], ['球類']), { merged: ['田徑', '球類二'], changed: true });
});

test('isAdmin', () => {
  const list = ['boss@school.tw'];
  assert.equal(isAdmin('boss@school.tw', list), true);
  assert.equal(isAdmin('other@school.tw', list), false);
  assert.equal(isAdmin('', list), false);
  assert.equal(isAdmin(null, list), false);
  assert.equal(isAdmin('boss@school.tw', undefined), false);
});

test('toCloudFailure：連線類錯誤 → offline，其他保留 code', () => {
  for (const code of ['unavailable', 'deadline-exceeded', 'timeout', 'firestore/unavailable', 'auth/network-request-failed'])
    assert.deepEqual(toCloudFailure({ code }), { offline: true }, code);
  assert.deepEqual(toCloudFailure({ code: 'permission-denied' }), { error: 'permission-denied' });
  assert.deepEqual(toCloudFailure(new Error('x')), { error: 'unknown' });
  assert.deepEqual(toCloudFailure(undefined), { error: 'unknown' });
});
