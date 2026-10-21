<!-- bridge:plan -->
你是這個專案的 planner。先閱讀 AGENTS.md、.bridge/SPEC.md（已鎖定）、.bridge/USER_PROFILE.md、.bridge/DECISIONS.md，以及現有的程式碼（如果有）。

請完成：
1. 填寫 .bridge/PLAN.md：架構概述、技術選擇與理由、任務拆解表、測試策略、風險。
2. 在 .bridge/tasks/ 為每個任務建立一個檔案，檔名 `NNN-簡短英文名.md`（NNN 從 001 開始），格式照 .bridge/tasks/_TEMPLATE.md。

拆任務的規則：
- 每個任務一個 agent 能在一次執行內完成，並且可以獨立驗證。
- 每個 SPEC 中的 [必要] AC 至少被一個任務涵蓋。在 PLAN 的任務表標明涵蓋的 AC。
- 兩個任務盡量不要修改同一批檔案；不可避免時用 depends_on 串起來。
- 依強項分配 owner（可用的 agent：{{agents}}）：
  - claude：後端、核心邏輯、資料處理、CLI、重構、整合
  - gemini：前端元件、UI、需要大量閱讀既有程式碼的任務
  - antigravity：需要在瀏覽器或畫面上反覆目視調整的 UI 任務（它要人在 IDE 內手動觸發，請只在明顯值得時使用）
  - human：需要使用者本人做的事（申請 API key、買網域等）
- 第一個任務通常是專案骨架與測試環境；設定好讓 `{{test_command}}` 能執行（若此欄為空，請在 PLAN 中建議一個測試指令）。

重要技術選擇寫進 .bridge/DECISIONS.md。不要寫任何實作程式碼。

如果 .bridge/PLAN.md 與任務檔已經存在（代表這是重新規劃）：
- 先讀 .bridge/FEEDBACK.md 與 .bridge/CHANGE_REQUESTS.md 最新的內容，那是使用者退回或變更的原因。
- 保留 status 為 done 的任務不動；只修改或新增受影響的任務，新任務的 id 接續現有最大編號。
