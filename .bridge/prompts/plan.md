<!-- bridge:plan -->
你是這個專案的 planner。先閱讀 AGENTS.md、.bridge/SPEC.md（已鎖定）、.bridge/USER_PROFILE.md、.bridge/DECISIONS.md。現有的程式碼（如果有）先用 Glob／Grep 找出跟 SPEC 相關的部分再讀，不要逐檔通讀。

請完成：
1. 填寫 .bridge/PLAN.md：架構概述、技術選擇與理由、任務拆解表、測試策略、風險，以及「## 環境指令」：安裝套件、設定環境要用的指令，每行一條、用反引號包住。只寫單一指令，不要用 | && ; > $，也不要寫 rm、sudo、curl、bash、npx 或 python -c 這類。這個專案的 bridge.py 是舊版，不會自動放行，使用者核准 PLAN 時要自己把這些指令加進 agy 的權限白名單。不需要裝任何東西就寫「無」。
2. 在 .bridge/tasks/ 為每個任務建立一個檔案，檔名 `NNN-簡短英文名.md`（NNN 從 001 開始），格式照 .bridge/tasks/_TEMPLATE.md。

拆任務的規則：
- 每個任務一個 agent 能在一次執行內完成，並且可以獨立驗證。
- 每個 SPEC 中的 [必要] AC 至少被一個任務涵蓋。在 PLAN 的任務表標明涵蓋的 AC。
- 兩個任務盡量不要修改同一批檔案；不可避免時用 depends_on 串起來。
- 依強項分配 owner（可用的 agent：{{agents}}）：
  - claude：後端、核心邏輯、資料處理、CLI、重構、整合
  - gemini：前端元件、UI、需要大量閱讀既有程式碼的任務
  - antigravity：需要在瀏覽器或畫面上反覆目視調整的 UI 任務（它要人在 IDE 內手動觸發，請只在明顯值得時使用）
  - antigravity_flash：只改文件的任務（README、使用說明）。文件任務優先分給它
  - antigravity_sonnet：只當審查者，不要分配任務
  - human：需要使用者本人做的事（申請 API key、買網域等）
- 分配原則：claude 只做鷹架與把關，不做主體實作。實作任務（包含複雜或核心邏輯）分給 agy，並在任務檔寫好「## 介面契約」（模組、函式簽名與參數、資料結構、錯誤怎麼處理）。只有這些例外分給 claude：專案骨架與測試環境、資料庫 schema 與遷移、介面無法事先講清楚的設計工作（探索性設計、重新劃分模組邊界的重構）、需要隨意執行指令的探索式除錯、很小的修改（十幾行內）。安裝套件、設定環境分給 agy，需要的指令寫進 PLAN 的「## 環境指令」。
- 第一個任務通常是專案骨架與測試環境；設定好讓 `{{test_command}}` 能執行（若此欄為空，請在 PLAN 中建議一個測試指令）。

重要技術選擇寫進 .bridge/DECISIONS.md。不要寫任何實作程式碼。

如果 .bridge/PLAN.md 與任務檔已經存在（代表這是重新規劃）：
- 先讀 .bridge/FEEDBACK.md 與 .bridge/CHANGE_REQUESTS.md 最新的內容，那是使用者退回或變更的原因。
- 保留 status 為 done 的任務不動；只修改或新增受影響的任務，新任務的 id 接續現有最大編號。
