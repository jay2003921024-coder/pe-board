# 體育教案圖板

給體育老師畫教案戰術圖的網頁：14 種場地、學生／老師／器材／路線、多步驟教案與動畫、匯出 PNG、範本庫。
純靜態網站（原生 JavaScript ES modules，無建置步驟），部署在 GitHub Pages。

> 重構進行中：舊版單檔 `legacy/pe-board.html` 保留作為測試的參考答案，不再修改。

## 本機執行

需要 http(s) 網址（ES modules 與 Google 登入不支援 `file://` 直接雙擊開啟）。在專案根目錄執行：

```sh
python3 -m http.server 8000
```

然後用瀏覽器開啟 <http://localhost:8000/>。

## 測試

需要 Node.js 22 以上，不需要 `npm install`：

```sh
npm test
```

- `tests/unit/render.golden.test.js`：場地、物件、線條、工具圖示的 SVG 必須與舊版逐字相同
- `tests/unit/structure.test.js`：`js/`、`css/` 每檔不超過 400 行；`js/core/` 不得使用 `document`、`window`、`localStorage`、`navigator`
- `tests/helpers/legacy.js`：從 `legacy/pe-board.html` 依註解標記（`/* ---------- Courts ---------- */` 等）切出舊版程式碼，在 `node:vm` 中執行，當參考答案

## 目錄結構

```
legacy/pe-board.html   舊版原檔（凍結，只當測試參考答案）
js/core/               純邏輯：不碰 DOM、storage、Firebase，可直接用 Node 測
  util.js              W、FONT、uid、f、esc
  courts.js            14 種場地定義、scaleOf、courtH、courtSVG
  items.js             隊伍、顏色、物件與線條定義、單一物件外觀 shape
  render.js            itemSVG、lineSVG、boardContent、iconSVG
tests/unit/            node:test 單元測試
tests/helpers/         測試輔助（舊版程式碼載入、原始碼去註解字串）
```
