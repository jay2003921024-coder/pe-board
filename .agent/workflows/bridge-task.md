---
description: 執行 bridge 分派給 Antigravity 的任務
---

1. 閱讀 `AGENTS.md`、`.bridge/STATUS.md`、`.bridge/SPEC.md`、`.bridge/PLAN.md`。
2. 打開 `.bridge/inbox/` 裡最新的 `task-*.md` 指示檔，找出要做的任務檔（`.bridge/tasks/NNN-*.md`）。
3. 把任務檔的 `status` 改成 `in_progress`。
4. 依任務的「目標」與「驗收條件」實作。如果是 UI 任務，用瀏覽器打開畫面確認，截圖存到 `.bridge/evidence/<任務id>/`。
5. 自測通過後，在任務檔的「交接筆記」寫下：做了什麼、怎麼驗證（附截圖路徑）、已知限制。
6. 把 `status` 改成 `review`。
7. 告訴使用者：「任務完成，請在終端機執行 `python3 .bridge/bridge.py run` 繼續。」
