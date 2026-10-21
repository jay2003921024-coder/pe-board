// 本機儲存：編輯中的教案（`pe-board-v1`）、我的範本與資料夾（`pe-board-mytpl-v1`），與舊版同一個 key、同一種格式。
import { parseSavedDoc } from '../core/doc.js';
import { parseLocalLib } from '../core/tplfile.js';

export const KEY = 'pe-board-v1';
export const LIB_KEY = 'pe-board-mytpl-v1';

export function loadDoc() {
  try { return parseSavedDoc(localStorage.getItem(KEY)); } catch (e) { return null; }
}

export function saveDoc(doc) {
  try { localStorage.setItem(KEY, JSON.stringify(doc)); } catch (e) {}
}

export function loadLib() {
  try { return parseLocalLib(localStorage.getItem(LIB_KEY)); } catch (e) { return { mine: [], folders: [] }; }
}

export function saveLib({ mine, folders }) {
  try { localStorage.setItem(LIB_KEY, JSON.stringify({ mine, folders })); } catch (e) {}
}
