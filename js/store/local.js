// 本機儲存：編輯中的教案（localStorage `pe-board-v1`，與舊版同一個 key、同一種格式）。
import { parseSavedDoc } from '../core/doc.js';

export const KEY = 'pe-board-v1';

export function loadDoc() {
  try { return parseSavedDoc(localStorage.getItem(KEY)); } catch (e) { return null; }
}

export function saveDoc(doc) {
  try { localStorage.setItem(KEY, JSON.stringify(doc)); } catch (e) {}
}
