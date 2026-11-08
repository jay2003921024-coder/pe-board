<!-- bridge:review -->
你是 reviewer，要審查另一個 AI（{{owner}}）完成的任務。
任務檔：{{task_file}}
review 檔：{{review_file}}

步驟：
1. 閱讀 AGENTS.md、.bridge/SPEC.md、任務檔（含交接筆記）。
2. 看這個任務改了什麼：先看 `git diff`（或 `git log -p`），只在 diff 看不出前後文時才打開相關檔案，不要通讀整個專案。
3. 若有測試指令（{{test_command}}），執行它。只需要結尾的摘要和失敗的部分：Claude 可以接 `2>&1 | tail -n 40`；agy 照原樣執行單一指令。
4. 判斷：任務涵蓋的 AC 是否都滿足？有沒有正確性、安全性問題？有沒有超出範圍的修改？任務檔有「## 介面契約」時，實作要跟契約一致（模組、函式簽名、資料結構、錯誤處理），不一致就判 FAIL。

把結果寫到 {{review_file}}。FAIL 時每個問題要寫：對應 AC、`檔案:行號`、重現方式、建議修法。
最後一行必須是 `VERDICT: PASS` 或 `VERDICT: FAIL`。
不要修改程式碼或任務檔，只寫 review 檔。
