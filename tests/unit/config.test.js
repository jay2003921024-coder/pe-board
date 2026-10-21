// 前端設定與 Firestore 規則、索引的一致性（AC-24、29）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADMIN_EMAILS, FIREBASE_CONFIG, isConfigured } from '../../js/config/firebase-config.js';
import { DOC_JSON_MAX } from '../../js/core/share.js';

const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');

function rulesAdminEmails(rules) {
  const m = rules.match(/\/\/ ADMIN_EMAILS:BEGIN([\s\S]*?)\/\/ ADMIN_EMAILS:END/);
  if (!m) throw new Error('firestore.rules 找不到 // ADMIN_EMAILS:BEGIN 與 // ADMIN_EMAILS:END 標記');
  return [...m[1].matchAll(/'([^']+@[^']+)'/g)].map(x => x[1]).sort();
}

test('AC-24：ADMIN_EMAILS 與 firestore.rules 標記間的名單一致', () => {
  const inRules = rulesAdminEmails(read('firestore.rules'));
  assert.ok(inRules.length > 0, 'firestore.rules 的管理員名單是空的');
  assert.deepEqual(inRules, [...ADMIN_EMAILS].sort());
});

test('名單解析：找不到標記時清楚失敗；只取標記之間', () => {
  assert.throws(() => rulesAdminEmails("function adminEmails() { return ['a@b.c']; }"), /ADMIN_EMAILS:BEGIN/);
  const src = "'x@y.z'\n// ADMIN_EMAILS:BEGIN\nfunction adminEmails() { return [\n  'b@s.tw',\n  'a@s.tw', // 註解\n]; }\n// ADMIN_EMAILS:END\n'q@w.e'";
  assert.deepEqual(rulesAdminEmails(src), ['a@s.tw', 'b@s.tw']);
});

test('firestore.rules 的 docJson 上限與 DOC_JSON_MAX 相同', () => {
  const sizes = [...read('firestore.rules').matchAll(/docJson\.size\(\) <= (\d+)/g)].map(m => +m[1]);
  assert.ok(sizes.length > 0);
  assert.ok(sizes.every(n => n === DOC_JSON_MAX), `規則：${sizes}，程式：${DOC_JSON_MAX}`);
});

test('AC-29：firestore.indexes.json 含 shared 的 court ASC + createdAt DESC 索引', () => {
  const { indexes } = JSON.parse(read('firestore.indexes.json'));
  const ok = indexes.some(ix => ix.collectionGroup === 'shared' && ix.queryScope === 'COLLECTION'
    && JSON.stringify(ix.fields) === JSON.stringify([{ fieldPath: 'court', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }]));
  assert.ok(ok, JSON.stringify(indexes));
});

test('firebase.json 指向規則與索引檔', () => {
  const { firestore } = JSON.parse(read('firebase.json'));
  assert.equal(firestore.rules, 'firestore.rules');
  assert.equal(firestore.indexes, 'firestore.indexes.json');
});

test('isConfigured：佔位值為 false，填齊為 true', () => {
  assert.equal(typeof FIREBASE_CONFIG.apiKey, 'string');
  assert.equal(isConfigured({ apiKey: 'REPLACE_ME', authDomain: 'REPLACE_ME.firebaseapp.com', projectId: 'REPLACE_ME', appId: 'REPLACE_ME' }), false);
  assert.equal(isConfigured({ apiKey: 'k', authDomain: 'p.firebaseapp.com', projectId: 'p' }), false);
  assert.equal(isConfigured(null), false);
  assert.equal(isConfigured({ apiKey: 'k', authDomain: 'p.firebaseapp.com', projectId: 'p', appId: '1:2:web:3' }), true);
});

test('Firebase SDK 版本只定義在 js/store/firebase.js 一個常數', () => {
  const src = read('js/store/firebase.js');
  assert.match(src, /SDK_VERSION = '12\.19\.0'/);
  assert.equal((src.match(/12\.19\.0/g) || []).length, 1);
  assert.match(src, /firebasejs\/\$\{SDK_VERSION\}\//);
  assert.doesNotMatch(src, /firebasejs\/\d/);
});
