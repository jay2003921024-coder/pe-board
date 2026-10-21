---
description: 需求訪談階段，依 SPEC 草稿做 2–3 個可比較的原型
---

1. 閱讀 `.bridge/SPEC.md`（草稿）與 `.bridge/USER_PROFILE.md`。
2. 找出 SPEC 中「待原型確認」的部分（通常是畫面配置、互動流程、輸出格式）。
3. 做 **2–3 個方向明顯不同**的原型，放在 `.bridge/prototypes/<A|B|C>/`：
   - 網頁或 App：單一 HTML 檔即可，不需要真的資料或後端
   - 腳本或 CLI：寫一份「假執行」的終端機輸出範例（`demo.txt`），展示指令用法與輸出長相
4. 每個原型截圖，存成 `.bridge/prototypes/<X>/preview.png`。
5. 寫 `.bridge/prototypes/README.md`：每個方向用一句話說明取捨（例如「A：資訊密度高，適合熟手」）。
6. 不要寫正式程式碼，這只是用來讓使用者挑方向。
7. 告訴使用者：「原型已完成，請回到 Claude Code 的 `/elicit` 繼續選擇。」
