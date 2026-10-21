---
description: 依 SPEC 的驗收條件，用瀏覽器做端到端驗收
---

1. 閱讀 `AGENTS.md`、`.bridge/SPEC.md`，以及 `.bridge/inbox/` 裡最新的 `verify-*.md` 指示檔（裡面有本輪 review 檔的路徑與啟動方式）。
2. 依指示啟動應用程式（網頁：開 dev server；App：開模擬器或桌面版；腳本：在終端機執行）。
3. 逐條驗證 SPEC 中的每一個 `AC-n`：
   - 照著 Given / When / Then 實際操作
   - 每條都截圖或錄影，存到 `.bridge/evidence/verify-r<輪次>/AC-n.png`
4. 把結果寫到指示檔指定的 review 檔，格式：

   ```
   | AC | 結果 | 證據 | 備註 |
   |---|---|---|---|
   | AC-1 | ✅ | evidence/verify-r1/AC-1.png | |
   | AC-2 | ❌ | evidence/verify-r1/AC-2.png | 按下儲存沒反應，console 有 TypeError |
   ```

   失敗的項目要寫清楚重現步驟和觀察到的錯誤。
5. 最後一行寫 `VERDICT: PASS`（全部通過）或 `VERDICT: FAIL`。
6. 告訴使用者：「驗收完成，請執行 `python3 .bridge/bridge.py run` 繼續。」
