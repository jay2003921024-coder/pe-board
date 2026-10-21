<!-- bridge:implement -->
你是 {{owner}}，負責實作一個任務。
任務檔：{{task_file}}

步驟：
1. 閱讀 AGENTS.md、.bridge/SPEC.md、.bridge/PLAN.md、.bridge/DECISIONS.md 與任務檔。
2. 若任務檔的「交接筆記」或 {{previous_review}} 中有上一輪的 review 意見，優先修正那些問題。
3. 實作任務，只碰這個任務需要的檔案。
4. 自我驗證：執行相關的測試（測試指令：{{test_command}}），確認涵蓋的 AC 都滿足。
5. 在任務檔「交接筆記」寫：做了什麼、怎麼驗證、已知限制。
6. 把任務檔的 `status` 改成 `review`。

如果發現 SPEC 有矛盾或無法完成：在交接筆記寫明原因，把 `status` 改成 `blocked`，然後停止。
