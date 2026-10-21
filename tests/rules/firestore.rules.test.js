// Firestore 規則測試（AC-23、24、25）與 js/store/cloud.js 對 emulator 的實際存取（AC-22、28、29）。
// 執行：npm run test:rules（需 Java 與 npm install）。
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'firebase/firestore';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { createCloud } from '../../js/store/cloud.js';
import { DOC_JSON_MAX, planFirstUpload } from '../../js/core/share.js';
import { ADMIN_EMAILS } from '../../js/config/firebase-config.js';

let env;
before(async () => {
  fs.setLogLevel('silent'); // 被拒的寫入是預期結果，不必印 SDK 警告
  env = await initializeTestEnvironment({
    projectId: 'demo-pe-board',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(() => env?.cleanup());
beforeEach(() => env.clearFirestore());

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid, token = {}) => env.authenticatedContext(uid, token).firestore();
const alice = () => as('alice', { email: 'alice@school.tw', email_verified: true });
const bob = () => as('bob', { email: 'bob@school.tw', email_verified: true });
const admin = (verified = true) => as('admin', { email: ADMIN_EMAILS[0], email_verified: verified });

const docJson = JSON.stringify({ court: 'gym', grade: '國中', steps: [{ id: 's1', name: '', note: '', items: [] }] });
const shared = (o = {}) => ({ name: '三人傳切', court: 'gym', grade: '國中', steps: 1, docJson, authorUid: 'alice', authorName: 'Alice', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...o });
const mineRec = (o = {}) => ({ name: '我的', court: 'gym', grade: '國中', steps: 1, folder: '', updatedAt: 1, docJson, ...o });

async function seedShared(id = 's1', o = {}) {
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'shared', id), { ...shared(o), createdAt: Timestamp.fromMillis(1000), updatedAt: Timestamp.fromMillis(1000) }));
}

test('AC-25：未登入對每個集合寫入都被拒，但可讀共享區', async () => {
  await seedShared();
  const db = anon();
  await assertFails(setDoc(doc(db, 'shared', 'x'), shared()));
  await assertFails(updateDoc(doc(db, 'shared', 's1'), { name: '改' }));
  await assertFails(deleteDoc(doc(db, 'shared', 's1')));
  await assertFails(setDoc(doc(db, 'users', 'alice'), { folders: [] }));
  await assertFails(setDoc(doc(db, 'users', 'alice', 'templates', 't1'), mineRec()));
  await assertFails(setDoc(doc(db, 'other', 'x'), { a: 1 }));
  await assertSucceeds(getDoc(doc(db, 'shared', 's1')));
  await assertFails(getDoc(doc(db, 'users', 'alice')));
});

test('發布：本人可建立；偽造 authorUid、過大 docJson、多餘欄位、自訂時間都被拒', async () => {
  const db = alice();
  await assertSucceeds(setDoc(doc(db, 'shared', 'a'), shared()));
  await assertFails(setDoc(doc(db, 'shared', 'b'), shared({ authorUid: 'bob' })));
  await assertFails(setDoc(doc(db, 'shared', 'c'), shared({ docJson: 'x'.repeat(DOC_JSON_MAX + 1) })));
  await assertSucceeds(setDoc(doc(db, 'shared', 'c2'), shared({ docJson: 'x'.repeat(DOC_JSON_MAX) })));
  await assertFails(setDoc(doc(db, 'shared', 'd'), shared({ extra: 1 })));
  await assertFails(setDoc(doc(db, 'shared', 'e'), shared({ createdAt: Timestamp.fromMillis(0) })));
  await assertFails(setDoc(doc(db, 'shared', 'f'), shared({ name: 'x'.repeat(41) })));
  await assertFails(setDoc(doc(db, 'shared', 'g'), shared({ steps: 1.5 })));
});

test('AC-23：作者可改刪自己的；他人改刪被拒；作者不可改 authorUid／createdAt', async () => {
  await seedShared();
  await assertFails(updateDoc(doc(bob(), 'shared', 's1'), { name: '別人改', updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(doc(bob(), 'shared', 's1')));
  await assertFails(updateDoc(doc(alice(), 'shared', 's1'), { authorUid: 'bob', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(alice(), 'shared', 's1'), { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(doc(alice(), 'shared', 's1'), { name: '作者改', updatedAt: serverTimestamp() }));
  await assertSucceeds(deleteDoc(doc(alice(), 'shared', 's1')));
});

test('AC-24：管理員（email 已驗證）可刪任何範本，但不能改；未驗證 email 不算管理員', async () => {
  await seedShared();
  await assertFails(deleteDoc(doc(admin(false), 'shared', 's1')));
  await assertFails(updateDoc(doc(admin(), 'shared', 's1'), { name: '管理員改', updatedAt: serverTimestamp() }));
  await assertSucceeds(deleteDoc(doc(admin(), 'shared', 's1')));
});

test('users/{uid} 與 templates 只限本人讀寫', async () => {
  await assertSucceeds(setDoc(doc(alice(), 'users', 'alice'), { folders: ['球類'] }));
  await assertSucceeds(setDoc(doc(alice(), 'users', 'alice', 'templates', 't1'), mineRec()));
  await assertSucceeds(getDoc(doc(alice(), 'users', 'alice', 'templates', 't1')));
  await assertFails(getDoc(doc(bob(), 'users', 'alice')));
  await assertFails(getDoc(doc(bob(), 'users', 'alice', 'templates', 't1')));
  await assertFails(setDoc(doc(bob(), 'users', 'alice'), { folders: [] }));
  await assertFails(setDoc(doc(bob(), 'users', 'alice', 'templates', 't2'), mineRec()));
  await assertFails(deleteDoc(doc(bob(), 'users', 'alice', 'templates', 't1')));
  await assertFails(setDoc(doc(alice(), 'users', 'alice'), { folders: [], other: 1 }));
  await assertFails(setDoc(doc(alice(), 'users', 'alice', 'templates', 't3'), mineRec({ docJson: 'x'.repeat(DOC_JSON_MAX + 1) })));
  await assertFails(setDoc(doc(alice(), 'other', 'x'), { a: 1 }));
});

// ---- cloud.js 實際對 emulator 存取 ----
const cloudFor = db => createCloud(async () => ({ db, fs }));
const tpl = (name, court = 'gym', o = {}) => ({ id: 't' + name, name, folder: '', updatedAt: 5, doc: { title: name, court, grade: '國中', steps: [{ id: 's', name: '', note: '', items: [] }] }, ...o });
const ALICE = { uid: 'alice', name: 'Alice 老師' };

test('AC-22：發布後重新讀取即可見，含作者名稱與發布時間；未登入也讀得到', async () => {
  const r = await cloudFor(alice()).publish(tpl('傳球'), ALICE);
  assert.ok(r.ok && r.id, JSON.stringify(r));
  const list = await cloudFor(anon()).listShared();
  assert.equal(list.ok, true);
  assert.equal(list.items.length, 1);
  const it = list.items[0];
  assert.equal(it.id, r.id); assert.equal(it.name, '傳球'); assert.equal(it.authorName, 'Alice 老師'); assert.equal(it.authorUid, 'alice');
  assert.ok(it.createdAt > Date.now() - 60000, '發布時間應為伺服器時間');
  assert.equal(it.doc.court, 'gym');
});

test('AC-23／24／25：存取層回報被拒（error code），作者可改刪、管理員可下架', async () => {
  const { id } = await cloudFor(alice()).publish(tpl('原名'), ALICE);
  assert.deepEqual(await cloudFor(anon()).publish(tpl('x'), { uid: 'nobody', name: 'x' }), { error: 'permission-denied' });
  assert.deepEqual(await cloudFor(bob()).updateShared(id, tpl('亂改')), { error: 'permission-denied' });
  assert.deepEqual(await cloudFor(bob()).deleteShared(id), { error: 'permission-denied' });
  assert.equal((await cloudFor(alice()).updateShared(id, tpl('新名', 'soccer'))).ok, true);
  const [it] = (await cloudFor(anon()).listShared()).items;
  assert.equal(it.name, '新名'); assert.equal(it.court, 'soccer'); assert.equal(it.authorName, 'Alice 老師');
  assert.equal((await cloudFor(admin()).deleteShared(id)).ok, true);
  assert.equal((await cloudFor(anon()).listShared()).items.length, 0);
});

test('AC-29：依場地篩選、分頁（cursor）', async () => {
  const c = cloudFor(alice());
  for (let i = 0; i < 5; i++) await c.publish(tpl('籃' + i, 'bb-half'), ALICE);
  await c.publish(tpl('足', 'soccer'), ALICE);
  const p1 = await c.listShared({ court: 'bb-half', limit: 3 });
  assert.equal(p1.items.length, 3); assert.equal(p1.more, true);
  const p2 = await c.listShared({ court: 'bb-half', limit: 3, after: p1.cursor });
  assert.equal(p2.items.length, 2); assert.equal(p2.more, false);
  const names = [...p1.items, ...p2.items].map(t => t.name);
  assert.deepEqual(names, ['籃4', '籃3', '籃2', '籃1', '籃0'], '新到舊、不重複');
  assert.equal((await c.listShared()).items.length, 6);
});

test('AC-28：首次登入上傳、我的範本存取、資料夾合併不覆蓋', async () => {
  const c = cloudFor(alice());
  await c.saveMine('alice', tpl('雲端已有', 'gym', { id: 'tA', folder: '球類' }));
  const before1 = await c.listMine('alice');
  const local = [tpl('雲端已有', 'gym', { id: 'tA' }), tpl('本機新', 'pool', { id: 'tB' })];
  const plan = planFirstUpload(local, before1.mine);
  assert.deepEqual(plan.map(t => t.id), ['tB']);
  for (const t of plan) assert.equal((await c.saveMine('alice', t)).ok, true);
  const { mine } = await c.listMine('alice');
  assert.deepEqual(mine.map(t => t.id).sort(), ['tA', 'tB']);
  assert.equal(mine.find(t => t.id === 'tB').doc.court, 'pool');

  assert.deepEqual((await c.saveFolders('alice', ['球類', '田徑'])).folders, ['球類', '田徑']);
  assert.deepEqual((await c.saveFolders('alice', ['游泳'])).folders, ['球類', '田徑', '游泳'], '另一台裝置的資料夾不會被覆蓋');
  assert.deepEqual((await c.saveFolders('alice', ['球類二'], ['球類'])).folders, ['田徑', '游泳', '球類二'], '改名：舊名移除');
  assert.deepEqual((await c.listMine('alice')).folders, ['田徑', '游泳', '球類二']);

  assert.equal((await c.deleteMine('alice', 'tB')).ok, true);
  assert.deepEqual((await c.listMine('alice')).mine.map(t => t.id), ['tA']);
  assert.deepEqual(await cloudFor(bob()).listMine('alice'), { error: 'permission-denied' });
});
