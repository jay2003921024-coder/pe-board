<!-- bridge:verify -->
你是驗收者。所有任務已完成，請依 SPEC 做端到端驗收（第 7 輪）。
review 檔：.bridge/reviews/verify-r7.md
啟動方式：（未設定，請依 PLAN 或 README 判斷）
自動測試結果摘要：
（未設定自動測試）

步驟：
1. 閱讀 AGENTS.md 與 .bridge/SPEC.md。
2. 依啟動方式執行應用程式。
3. 逐條驗證每一個 AC（照 Given / When / Then 實際操作）。證據（截圖、輸出）存到 .bridge/evidence/verify-r7/。
4. 把結果寫到 review 檔，用表格：| AC | 結果 | 證據 | 備註 |。失敗項目寫清楚重現步驟與錯誤訊息。
5. 最後一行必須是 `VERDICT: PASS` 或 `VERDICT: FAIL`。

不要修改程式碼。
