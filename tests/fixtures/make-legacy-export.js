// 產生 legacy-export.json：以舊版程式碼模擬「我的範本」放了 8 個內建範本（分在不同資料夾）後按「匯出全部」的檔案。
// 用法：node tests/fixtures/make-legacy-export.js（舊版凍結，產生結果固定）
import { writeFileSync } from 'node:fs';
import { loadLegacy } from '../helpers/legacy.js';

const L = loadLegacy(['Courts', 'Objects', 'Templates'], { seed: 2026, snippets: ['normalizeDoc', 'tplFromDoc'] });
const folders = ['球類', '', '球類', '田徑與游泳', '球類', '', '', '田徑與游泳'];
const mine = L.TEMPLATES.map((t, i) => ({ ...L.tplFromDoc(L.docFromTemplate(t), { name: t.title }), id: 't' + L.uid(), folder: folders[i], kind: 'tpl', updatedAt: 1760000000000 + i }));
// 舊版 exportTemplates 的那一行（exportedAt 固定）。
const data = JSON.stringify({ app: 'pe-board', version: 1, exportedAt: '2026-10-01T08:00:00.000Z', templates: mine.map(({ id, kind, ...r }) => r) }, null, 1);
writeFileSync(new URL('./legacy-export.json', import.meta.url), data);
