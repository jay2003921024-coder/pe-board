// 範本庫「我的範本」與「資料夾」的讀寫介面：來源可替換。這裡只實作本機版本（localStorage）；
// 008 會加入雲端（Firestore）版本，並在登入時把這個模組換成雲端實作（同一組函式名）。
import { loadLib, saveLib } from '../store/local.js';

let mine = [], folders = [];
({ mine, folders } = loadLib());

const subscribers = new Set();
function notify() { for (const fn of subscribers) fn({ mine, folders }); }
function persist() { saveLib({ mine, folders }); notify(); }

export const getMine = () => mine;
export const getFolders = () => folders;

// fn({ mine, folders }) 會在資料變動時呼叫（本機版本是同步的；雲端版本的 onSnapshot 是非同步的）。
// 回傳取消訂閱的函式。
export function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

export async function saveTpl(t) {
  t = { ...t, kind: 'tpl', updatedAt: Date.now() };
  const i = mine.findIndex(x => x.id === t.id);
  if (i >= 0) mine[i] = t; else mine.push(t);
  persist();
  return t;
}

export async function deleteTpl(id) {
  mine = mine.filter(t => t.id !== id);
  persist();
}

export async function saveFolders(list) {
  folders = [...new Set(list.filter(Boolean))];
  persist();
}
