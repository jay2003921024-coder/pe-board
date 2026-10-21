---
id: 002
title: 教案資料、範本、復原重做、動畫配對、匯出 SVG、範本檔核心
owner: claude
status: todo
depends_on: [001]
reviewer: antigravity
attempts: 0
---

## 目標

把舊版其餘的純邏輯搬成 `js/core/` 模組（參數化，不讀全域 doc），並以單元測試＋ golden test 覆蓋 AC-13 要求的四項：教案資料正規化（含舊版資料）、範本檔匯入/匯出、復原/重做、動畫物件配對。

## 涵蓋的驗收條件

- AC-4（動畫配對與路徑邏輯與舊版相同）
- AC-5（`exportSVG` 單步／全部＋說明與舊版逐字相同）
- AC-6（能讀舊版 `pe-board-v1` 與 `pe-board-mytpl-v1` 的內容格式）
- AC-7（舊版範本檔可解析；新版輸出可再解析）
- AC-8（8 個內建範本內容與舊版相同）
- AC-13（四項測試）

## 實作提示

模組（從舊版搬移，演算法與輸出格式不變）：
- `js/core/templates.js`：`tplBuilder`、`TEMPLATES`、`docFromTemplate`（舊版 521～659 行）。若超過 400 行可拆 `templates-data.js`。
- `js/core/doc.js`：`normalizeDoc`（1315 行）、`tplFromDoc`、`shiftObj`、`nextLabel(items, team)`、`parseSavedDoc(raw)`（對應 664 行：JSON 解析、`steps` 非空、`COURTS[court]` 存在才採用，否則回 null）。
- `js/core/history.js`：`createHistory({limit:80})` 提供 `push(snapshotJson)`、`undo(currentJson)`、`redo(currentJson)`、`canUndo/canRedo`、`popLast()`（對應 endDrag 中取消太短線條時 `undoStack.pop()`），行為同 683～686 行。
- `js/core/anim.js`：`ease`、`sameZone`、`matchItems`、`findPath`、`planTransition(doc, i)`、`posAt`（1065～1119 行）。
- `js/core/exportsvg.js`：`wrapText`、`exportSVG(doc, indices, withNotes)`（1175～1220 行）。
- `js/core/tplfile.js`：
  - `serializeTemplates(list)` → 與舊版 1469 行相同結構的字串（`exportedAt` 可注入以便測試）
  - `parseTemplateFile(text)` → `[{name, folder, doc}]`；支援 `{templates:[...]}` 與單一 doc（1485 行）；名稱/資料夾截 40 字；格式錯誤 throw
  - `parseLocalLib(raw)` → `{mine, folders}`（1255 行，壞資料回空陣列）、`allFolders(mine, folders)`

測試：
- `doc.test.js`：舊版格式 doc（含未知物件類型、缺欄位、不存在的場地、空 steps、`srcTpl`）正規化結果；`parseSavedDoc` 對合法/損壞/空值。
- `tplfile.test.js`：手寫一份「舊版匯出檔」fixture（`tests/fixtures/legacy-export.json`，用 legacy helper 跑舊版 `docFromTemplate` 產生內容）→ 解析出全部範本；serialize→parse 往返相等；壞 JSON、空 templates。
- `history.test.js`：push/undo/redo、上限 80、push 後清空 redo。
- `anim.golden.test.js`：對 8 個內建範本的每個步驟轉換，`planTransition` 的配對結果（以物件 id/類型表示）與舊版相同；另加手寫案例：同 id、同隊同號、最近距離、文字需同 label、沿箭頭路徑。
- `export.golden.test.js`、`templates.golden.test.js`：擴充 001 的 legacy helper 載入 Export/Step animation 段落（舊版 exportSVG 讀全域 `doc`，在 vm context 中注入）；8 個範本 × 單步/全部＋說明 逐字相同；範本內容（去掉隨機 id 後）相同。

## 交接筆記

<!-- 實作者完成後填寫：做了什麼、怎麼驗證、已知限制 -->
