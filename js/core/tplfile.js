// 範本檔 `{ app: 'pe-board', version: 1, templates }` 的序列化與解析，以及本機範本庫 `pe-board-mytpl-v1` 的解析。
import { normalizeDoc } from './doc.js';

// 與舊版 exportTemplates 相同的字串（去掉 id、kind）；exportedAt 可注入以便測試。
export function serializeTemplates(list, exportedAt = new Date().toISOString()) {
  return JSON.stringify({ app: 'pe-board', version: 1, exportedAt, templates: list.map(({ id, kind, ...r }) => r) }, null, 1);
}

// 回傳 [{ name, folder, doc }]，doc 已正規化；接受 { templates: [...] } 或單一教案。
// 不是 JSON、不是物件、範本項目不是物件時 throw；找不到範本回空陣列。
export function parseTemplateFile(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('範本檔格式錯誤');
  const list = Array.isArray(data.templates) ? data.templates : data.steps ? [{ name: data.title, doc: data }] : [];
  return list.map(x => {
    if (!x || typeof x !== 'object') throw new Error('範本檔格式錯誤');
    return {
      name: String(x.name || x.doc?.title || '匯入的範本').slice(0, 40),
      folder: typeof x.folder === 'string' ? x.folder.slice(0, 40) : '',
      doc: normalizeDoc(x.doc),
    };
  });
}

// localStorage `pe-board-mytpl-v1` 的字串 → { mine, folders }；壞資料回空陣列。
export function parseLocalLib(raw) {
  let mine = [], folders = [];
  try { const d = JSON.parse(raw || '{}'); mine = Array.isArray(d.mine) ? d.mine : []; folders = Array.isArray(d.folders) ? d.folders : []; } catch (e) {}
  return { mine, folders };
}

export const allFolders = (mine, folders) => [...new Set([...folders, ...mine.map(t => t.folder || '').filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
