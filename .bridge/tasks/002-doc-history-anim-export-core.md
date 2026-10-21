---
id: 002
title: 教案資料、範本、復原重做、動畫配對、匯出 SVG、範本檔核心
owner: claude
status: done
depends_on: [001]
reviewer: claude
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

### 做了什麼（claude，2026-10-21）

- 新增 `js/core/` 模組（演算法、輸出字串與舊版相同，只把讀全域 `doc`/`step()` 改為參數）：
  - `templates.js`（143 行）：舊版 521–659 行以腳本**原文搬移**，只加 `export`／`import`。
  - `doc.js`：`normalizeDoc`、`tplFromDoc`、`parseSavedDoc(raw)`（對應 664 行；合法時原樣回傳、不正規化，同舊版）、`shiftObj`、`nextLabel(items, team)`。
  - `history.js`：`createHistory({limit:80})` → `push(json)`、`undo(currentJson)`／`redo(currentJson)`（無可用時回 `null`，不動堆疊）、`canUndo`／`canRedo`、`popLast()`，另加 `clear()`（003 開新教案時可能用到，未在舊版出現）。
  - `anim.js`：`ease`、`sameZone`、`matchItems`、`findPath`、`planTransition(doc, i)`、`posAt`。
  - `exportsvg.js`：`wrapText`、`exportSVG(doc, indices, withNotes)`。
  - `tplfile.js`：`serializeTemplates(list, exportedAt?)`、`parseTemplateFile(text)`（回 `[{name, folder, doc}]`，**doc 已 normalizeDoc**；JSON 錯誤、資料不是物件、範本項目不是物件時 throw；找不到範本回 `[]`，UI 據此顯示「這個檔案裡找不到範本」）、`parseLocalLib(raw)`、`allFolders(mine, folders)`。
- 擴充 `tests/helpers/legacy.js`：
  - `snippets` 選項：從整份舊版程式碼切出單一頂層 `function`／單行 `const`（`normalizeDoc`、`tplFromDoc` 所在的 Template library 段有大量 DOM 副作用，無法整段執行）。
  - Proxy 加 `set`：`L.doc = d` 改 vm 全域，讓讀全域 `doc` 的舊版 `exportSVG`／`planTransition` 可直接比對，不需要靜態 fixture。
  - 假 `document.querySelector` 回傳含 `addEventListener` 的物件（Step animation／Export 段頂層有綁事件）。
  - `withSeed(seed, fn)`：暫時把本 realm 的 `Math.random` 換成同種子亂數，讓新模組的 `uid()` 與舊版序列相同 → 範本、正規化結果連 id 都能逐字比對。
- `tests/fixtures/legacy-export.json` ＋ 產生腳本 `tests/fixtures/make-legacy-export.js`：用舊版 `docFromTemplate`＋`tplFromDoc`＋舊版 exportTemplates 那一行 `JSON.stringify` 產生，8 個範本分在 3 種資料夾（含未分類）。
- 測試（新增 59 個，共 89 個）：`doc.test.js`、`tplfile.test.js`、`history.test.js`、`anim.golden.test.js`、`export.golden.test.js`、`templates.golden.test.js`。

### 怎麼驗證

- `npm test`（Node v26.3.0）：89 個測試全過，約 0.8 秒。
- AC 對應：
  - AC-4：每個多步驟範本的每個轉換（含反向）、以及 8×8 個「範本 A 第一步 → 範本 B 最後一步」組合，`planTransition` 的 moves／path／gone／appear／zones／linesOut（以 items 索引表示）與舊版相同，`posAt` 在 e=0/0.13/0.5/0.87/1 逐值相同；手寫案例：同 id 優先、同 id 不同類型不配對、同隊同號優先於距離（含數字 label）、最近距離、文字需同 label、人只走跑動/運球線而球可走傳球線、起點 45／終點 60 門檻、區域保留/淡出/淡入、旋轉走最短方向。
  - AC-5：8 範本 × 每個單步（含/不含說明）＋全部＋說明＋全部不含說明，加上 6 種邊界教案（空欄位、特殊字元、長資訊列換行、單步無/有名稱、長說明含空行、iconScale），`exportSVG` 與舊版逐字相同；`wrapText` 各種輸入相同。
  - AC-6：`normalizeDoc`／`tplFromDoc` 對舊版格式（未知類型、null 項目、缺欄位、items 非陣列、不存在場地、空 steps、srcTpl、iconScale 字串/0、非字串欄位、null/undefined）結果與舊版逐字相同；`parseSavedDoc` 與舊版 State 段在 vm 中讀假 localStorage 的結果一致（合法時同物件、不合法時舊版退回第一個範本）；`parseLocalLib` 讀舊版 `pe-board-mytpl-v1`，壞資料回空陣列。
  - AC-7：fixture 解析出 8 個範本，名稱/資料夾正確，doc 與舊版匯入流程結果相同；`serializeTemplates` 與舊版匯出字串逐字相同；新版匯出→匯入往返相等；單一教案檔、名稱/資料夾截 40 字、壞 JSON、空 templates。
  - AC-8：兩個種子下 8 個 `docFromTemplate` 與舊版完全相同（含 id）；`tplBuilder` 輔助函式相同。
  - AC-13：四項（正規化、範本檔、復原/重做、動畫配對）都有測試。
- 變異測試：分別改動 `findPath` 門檻、移除同隊比對、`exportSVG` 說明高度 +1、範本中一個座標、`normalizeDoc` 預設年段、history 上限，皆有測試失敗（1～9 個）；還原後全過。
- 結構測試照常通過（新檔皆 ≤ 400 行、core 無 DOM 字眼）。

### 已知限制

- `parseTemplateFile` 已回傳正規化後的 doc；004 匯入時照舊版寫法再呼叫 `tplFromDoc(doc, { name })` 也沒問題（`normalizeDoc` 可重複套用，已測）。
- 動畫的 `composite`／`caption`／`animFrame`（產生每格 SVG、讀播放速度）屬於播放 UI，留給 011 的 `ui/player.js`；本任務只搬純邏輯。
- 舊版 `allFolders` 讀 `lib`，無法在 vm 直接比對；新版 `allFolders(mine, folders)` 以手寫案例測試。
- fixture 的 JSON 由腳本產生後提交；舊版已凍結，所以不會過期。若要重產：`node tests/fixtures/make-legacy-export.js`。

