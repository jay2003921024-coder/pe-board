// 匯出圖片 modal：目前步驟／全部步驟＋說明、SVG 轉 canvas 2× PNG、複製圖片（搬自舊版 1221～1246 行）。
import { exportSVG } from '../core/exportsvg.js';
import { $, state, clearSel, renderAll } from './state.js';

let exportBlob = null, exportAll = false;

function buildExport() {
  exportBlob = null;
  const doc = state.doc;
  const svg = exportSVG(doc, exportAll ? doc.steps.map((_, i) => i) : [doc.cur], exportAll);
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas'), sc = 2;
    cv.width = img.width * sc; cv.height = img.height * sc;
    const ctx = cv.getContext('2d'); ctx.scale(sc, sc); ctx.drawImage(img, 0, 0);
    try { $('#expImg').src = cv.toDataURL('image/png'); cv.toBlob(b => { exportBlob = b; }, 'image/png'); }
    catch (err) { $('#expImg').src = img.src; }
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function setExpMode(all) {
  exportAll = all;
  $('#expCur').setAttribute('aria-pressed', !all);
  $('#expAll').setAttribute('aria-pressed', all);
  buildExport();
}

export function initExporter() {
  $('#btnExport').addEventListener('click', () => {
    clearSel(); renderAll();
    $('#exportModal').hidden = false;
    $('#expMsg').textContent = '在圖片上按右鍵（手機長按）可以「另存圖片」，或按「複製圖片」直接貼進 Word、Google 文件或簡報。';
    setExpMode(exportAll);
  });
  $('#expCur').addEventListener('click', () => setExpMode(false));
  $('#expAll').addEventListener('click', () => setExpMode(true));
  $('#btnCopyImg').addEventListener('click', () => {
    const msg = $('#expMsg');
    const fail = () => { msg.textContent = '這裡沒辦法直接複製。請在圖片上按右鍵（手機長按），選「複製圖片」或「另存圖片」。'; };
    try {
      if (!exportBlob || !window.ClipboardItem) return fail();
      navigator.clipboard.write([new ClipboardItem({ 'image/png': exportBlob })]).then(() => { msg.textContent = '已複製圖片，可以直接貼到 Word、Google 文件或簡報。'; }, fail);
    } catch (err) { fail(); }
  });
}
