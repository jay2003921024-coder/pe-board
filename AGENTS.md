# Bridge 協作協定（Claude Code × Antigravity / Gemini）

這個專案由多個 AI agent 分工完成，所有協作都透過 `.bridge/` 裡的檔案進行。
不論你是哪個 agent，開工前都必須遵守以下規則。

## 你的身分

| 你是 | 任務檔中的 owner |
|---|---|
| Claude Code | `claude` |
| Gemini CLI | `gemini` |
| Antigravity IDE 內的 agent | `antigravity` |

## 開工前必讀

1. `.bridge/STATUS.md`：目前階段、正在等誰
2. `.bridge/SPEC.md`：需求與驗收條件（AC）。**鎖定後不可修改**
3. `.bridge/PLAN.md` 與你負責的任務檔 `.bridge/tasks/NNN-*.md`
4. `.bridge/DECISIONS.md`：已做的決策，不要推翻；有異議寫進任務的交接筆記
5. `.bridge/USER_PROFILE.md`：使用者的偏好（技術棧、風格）

## 規則

- 只處理 `owner` 是自己的任務，不要改別人的任務內容。
- 不要編輯 `.bridge/state.json`、`.bridge/STATUS.md`（由 orchestrator 產生）。
- SPEC 鎖定後不可修改。發現需求有問題：在任務的「交接筆記」寫明，並把 `status` 設為 `blocked`，由人類決定是否提出變更。
- 不要擴大範圍：SPEC 的「非目標」一律不做。
- 任務完成的標準 = 任務檔引用的 AC 全部**可驗證地**滿足。
- 不要 `git push`、不要刪除不屬於你任務的檔案。

## 任務狀態

```
todo → in_progress → review → done
                 ↘ blocked
```

- 開始時改成 `status: in_progress`
- 實作完成、自測通過後改成 `status: review`，並在「交接筆記」寫：做了什麼、怎麼驗證、已知限制
- 不要自己把任務改成 `done`，由 orchestrator 依 review 結果處理

## Review

審查他人任務時，把結果寫到指定的 review 檔，**最後一行**必須是：

```
VERDICT: PASS
```
或
```
VERDICT: FAIL
```

FAIL 時列出具體問題：對應的 AC 編號、`檔案:行號`、重現方式、建議修法。
只審這些：是否滿足 AC、正確性、安全性、明顯的維護問題。不要因為風格偏好而判 FAIL。

## 決策紀錄

做了重要技術選擇（套件、資料結構、API 形狀、目錄結構）時，在 `.bridge/DECISIONS.md` 追加一條：
日期、決策、理由、誰做的。
