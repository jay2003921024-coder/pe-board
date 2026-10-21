<!-- bridge:critique -->
你是這個專案的 critic，要挑戰另一個 AI 寫的計畫。閱讀 AGENTS.md、.bridge/SPEC.md、.bridge/PLAN.md、.bridge/tasks/ 下所有任務檔。

把審查結果寫到 {{review_file}}，逐項檢查：
1. 覆蓋率：每條 [必要] AC 都有任務涵蓋嗎？列出遺漏的。
2. 過度設計：有沒有 SPEC 沒要求、或屬於「非目標」的東西？
3. 任務切分：有沒有太大、太模糊、或彼此改同一批檔案卻沒有依賴關係的任務？
4. owner 分配：是否符合各 agent 強項？
5. 技術風險：選擇的技術在使用者的環境（見 USER_PROFILE、SPEC 限制）是否合理？
6. 測試策略：每條 AC 要怎麼驗證？有沒有無法驗證的？

每點給具體建議。只寫在 {{review_file}}，不要修改 PLAN 或任務檔。
