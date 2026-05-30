"use client";

import * as React from "react";

import { MarkdownRenderer } from "@/lib/markdown/Renderer";

// Triple-backtick shorthand — avoids escaping inside template literals.
const T = "```";

function useDebounced<V>(value: V, ms: number): V {
  const [d, setD] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

interface Section {
  title: string;
  note?: string;
  code: string;
}

const SECTIONS: Section[] = [
  // ── 1. Headers ────────────────────────────────────────────────────────────
  {
    title: "標題層級",
    code: `# 一級標題

## 二級標題

### 三級標題`,
  },

  // ── 2. Common syntax ──────────────────────────────────────────────────────
  {
    title: "常用語法",
    code: `**粗體文字**

*斜體文字*

[連結文字](https://example.com)

行內數學：$E = mc^2$

數學方程式：
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

腳注範例：這段文字附有腳注[^1]，以及第二個腳注[^note]。

[^1]: 這是第一個腳注的說明文字。
[^note]: 這是第二個腳注，可以寫更長的解釋。`,
  },

  // ── 3. Images & captions ─────────────────────────────────────────────────
  {
    title: "圖片與圖說",
    note: "在右側「資源」面板上傳圖片後，點擊「插入」按鈕，系統會自動插入以下格式的 Markdown。引號內的文字會顯示為圖說（figcaption）。若不需要圖說，可刪去第三個引數。",
    code: `![這是替代文字](https://picsum.photos/600/300 "圖 1：這段文字會顯示在圖片下方作為圖說")`,
  },

  // ── 4. Table ──────────────────────────────────────────────────────────────
  {
    title: "表格",
    code: `| 縣市 | 人口（萬）| 面積（km²）|
|------|---------|----------|
| 台北市 | 248 | 272 |
| 新北市 | 407 | 2,053 |
| 桃園市 | 233 | 1,221 |
| 台中市 | 285 | 2,215 |`,
  },

  // ── 5. Code blocks ────────────────────────────────────────────────────────
  {
    title: "程式碼區塊",
    code: `行內程式碼：\`print("Hello, World!")\`

${T}python
def greet(name: str) -> str:
    return "Hello, " + name

print(greet("World"))
${T}

${T}javascript
function greet(name) {
  return "Hello, " + name;
}
console.log(greet("World"));
${T}

${T}r
df <- read.csv("data.csv")
summary(df$income)
${T}`,
  },

  // ── 6. YouTube embed ─────────────────────────────────────────────────────
  {
    title: "YouTube 影片嵌入",
    note: "將 YouTube 網址單獨放在一行（前後不要有其他文字），系統會自動嵌入影片播放器。",
    code: `https://www.youtube.com/watch?v=OaTKaHKCAFg`,
  },

  // ── 7. Observable: load CSV via URL (bar chart) ───────────────────────────
  {
    title: "上傳資料：透過 URL 載入 CSV",
    note: "① 在右側「資源」面板上傳 CSV 檔 → ② 點「複製連結」取得 Firebase 網址 → ③ 將網址放進程式碼中用變項紀錄，即可用 d3.csv() 載入資料並繪圖。",
    code: `${T}observable
const SAMPLE_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Ffedb5a43-7a51-4af4-b35c-983ff2fbfc4f_house_price_sample.csv?alt=media&token=bf34c94c-9969-459e-b1c3-efec6c703f54";
// ↑ 換成您上傳的 CSV 下載網址（此為 591 房價示範資料集）

const raw = await d3.csv(SAMPLE_URL, d => ({
  city: d["縣市"],
  price: +d["單價元/坪"],
}));

// 研究問題：台北市 vs. 桃園市每坪均價差距有多大？
// d3.rollup 依縣市彙整每坪均價（在瀏覽器端完成）
const data = Array.from(
  d3.rollup(raw, v => d3.mean(v, d => d.price), d => d.city),
  ([city, mean]) => ({city, mean})
);

return Plot.plot({
  width: 400, height: 260,
  y: {label: "每坪均價（萬元）", tickFormat: d => (d/1e4).toFixed(0)},
  x: {label: null},
  marks: [
    Plot.barY(data, {x: "city", y: "mean", fill: "#3a5a3a", fillOpacity: .8, tip: true}),
    Plot.ruleY([0]),
  ],
});
${T}`,
  },

  // ── 8. Observable: histogram with slider ──────────────────────────────────
  {
    title: "滑桿控制直方圖",
    note: "研究問題：大台北房價分佈——最常見的每坪價格帶在哪裡？右偏分佈揭示了什麼？拖動滑桿調整組距，點擊城市按鈕切換篩選範圍。",
    code: `${T}observable
const SAMPLE_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Ffedb5a43-7a51-4af4-b35c-983ff2fbfc4f_house_price_sample.csv?alt=media&token=bf34c94c-9969-459e-b1c3-efec6c703f54";
const raw = await d3.csv(SAMPLE_URL, d => ({city: d["縣市"], price: +d["單價元/坪"]}));

const container = document.createElement("div");
container.style.cssText = "font-family:sans-serif;padding:8px;";
const CITIES = ["All", "台北市", "新北市", "桃園市"];
let sel = null, bins = 20;

const btnRow = document.createElement("div");
btnRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;";
const btns = {};
for (const c of CITIES) {
  const b = document.createElement("button");
  b.textContent = c;
  b.style.cssText = "padding:3px 10px;font-size:12px;border-radius:4px;cursor:pointer;border:1.5px solid #3a5a3a;";
  b.addEventListener("click", () => {
    sel = c === "All" ? null : c;
    for (const [k, el] of Object.entries(btns)) {
      el.style.background = k === (sel || "All") ? "#3a5a3a" : "white";
      el.style.color = k === (sel || "All") ? "white" : "#3a5a3a";
    }
    draw();
  });
  btns[c] = b; btnRow.appendChild(b);
}
btns["All"].style.background = "#3a5a3a"; btns["All"].style.color = "white";
for (const [k, el] of Object.entries(btns)) if (k !== "All") { el.style.background = "white"; el.style.color = "#3a5a3a"; }

const slRow = document.createElement("div");
slRow.style.cssText = "display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:8px;";
const lbl = document.createElement("span"); lbl.textContent = "組距數：";
const sl = document.createElement("input"); sl.type = "range"; sl.min = 5; sl.max = 50; sl.value = 20;
sl.style.cssText = "width:120px;accent-color:#3a5a3a;";
const vl = document.createElement("span"); vl.style.color = "#3a5a3a";
sl.addEventListener("input", () => { bins = +sl.value; draw(); });
slRow.append(lbl, sl, vl);

const chartDiv = document.createElement("div");
function draw() {
  vl.textContent = bins;
  const vis = sel ? raw.filter(d => d.city === sel) : raw;
  chartDiv.innerHTML = "";
  chartDiv.appendChild(Plot.plot({
    width: 400, height: 220,
    marks: [
      Plot.rectY(vis, Plot.binX({y: "count"}, {x: d => d.price, thresholds: bins, fill: "#3a5a3a", fillOpacity: .75})),
      Plot.ruleY([0]),
    ],
    x: {label: "每坪單價（元）→"},
    y: {label: "成交筆數"},
  }));
}
draw();
container.append(btnRow, slRow, chartDiv);
return container;
${T}`,
  },

  // ── 9. Observable: scatter + regression ───────────────────────────────────
  {
    title: "散佈圖 + 迴歸線",
    note: "研究問題：房齡折舊效果——老屋每坪是否明顯比新屋便宜？三個城市的折舊斜率一樣嗎？每點代表一筆交易，迴歸線顯示各城市線性趨勢。",
    code: `${T}observable
const SAMPLE_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Ffedb5a43-7a51-4af4-b35c-983ff2fbfc4f_house_price_sample.csv?alt=media&token=bf34c94c-9969-459e-b1c3-efec6c703f54";
const raw = await d3.csv(SAMPLE_URL, d => ({
  city: d["縣市"], age: +d["房齡"], price: +d["單價元/坪"]
}));
const data = raw.filter(d => d.age <= 60 && d.price < 1500000);

return Plot.plot({
  width: 400, height: 300,
  color: {legend: true},
  marks: [
    Plot.dot(data, {x: "age", y: "price", fill: "city", fillOpacity: .35, r: 2.5, tip: true}),
    Plot.linearRegressionY(data, {x: "age", y: "price", stroke: "city", strokeWidth: 2}),
  ],
  x: {label: "房齡（年）→"},
  y: {label: "每坪單價（元）"},
});
${T}`,
  },

  // ── 10. Observable: line + area (time series) ─────────────────────────────
  {
    title: "折線圖 + 面積",
    note: "研究問題：2019–2024 房市成交量趨勢——COVID 與升息如何衝擊三大都市的交易量？灰色虛線 = COVID（2020-02），紅色虛線 = 央行升息開始（2022-03）。",
    code: `${T}observable
const MONTHLY_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Fd41a58ae-0e81-404e-af88-276c50de79db_house_price_monthly.csv?alt=media&token=ee4fdd3d-1554-47c9-a847-371a04414fd0";
const raw = await d3.csv(MONTHLY_URL, d => ({
  city: d["縣市"],
  date: new Date(+d["年_西元"], +d["月"] - 1),
  count: +d["count"],
}));
raw.sort((a, b) => a.date - b.date);

return Plot.plot({
  width: 400, height: 280,
  color: {legend: true},
  marks: [
    Plot.areaY(raw, {x: "date", y: "count", fill: "city", fillOpacity: .1, curve: "monotone-x"}),
    Plot.line(raw, {x: "date", y: "count", stroke: "city", strokeWidth: 2, curve: "monotone-x"}),
    Plot.ruleX([new Date(2020, 1)], {stroke: "#888", strokeDasharray: "4,3"}),
    Plot.ruleX([new Date(2022, 2)], {stroke: "#c0392b", strokeDasharray: "4,3"}),
  ],
  x: {label: null},
  y: {label: "成交量"},
});
${T}`,
  },

  // ── 11. Observable: animated line chart ───────────────────────────────────
  {
    title: "動態呈現資料趨勢",
    note: "研究問題：各行政區 2019–2024 年每坪均價如何演變？哪個區域漲最多？按 ▶ Play 逐年播放折線圖，或拖動滑桿查看任一年份。",
    code: `${T}observable
const SAMPLE_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Ffedb5a43-7a51-4af4-b35c-983ff2fbfc4f_house_price_sample.csv?alt=media&token=bf34c94c-9969-459e-b1c3-efec6c703f54";
const raw = await d3.csv(SAMPLE_URL, d => ({
  district: d["鄉鎮市區"], year: +d["年_西元"], price: +d["單價元/坪"]
}));
// Top 8 districts by row count for readability
const top8 = Array.from(d3.rollup(raw, v => v.length, d => d.district).entries())
  .sort((a, b) => b[1] - a[1]).slice(0, 8).map(d => d[0]);
const sub = raw.filter(d => top8.includes(d.district));
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];
// Pre-compute (district, year) → median price; sort by year so Plot.line
// connects points in chronological order regardless of rollup iteration order.
const pts = [];
for (const [district, yMap] of d3.rollup(sub, v => d3.median(v, d => d.price), d => d.district, d => d.year))
  for (const [year, med] of yMap) pts.push({district, year, med});
pts.sort((a, b) => a.year - b.year);

const container = document.createElement("div");
container.style.cssText = "font-family:sans-serif;padding:8px;";
const ctrls = document.createElement("div");
ctrls.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:8px;";
const btn = document.createElement("button");
btn.textContent = "▶ Play";
btn.style.cssText = "padding:4px 14px;font-size:13px;border:1px solid #3a5a3a;border-radius:4px;background:#3a5a3a;color:white;cursor:pointer;";
const scrub = document.createElement("input");
scrub.type = "range"; scrub.min = 0; scrub.max = YEARS.length - 1; scrub.value = 0;
scrub.style.cssText = "width:160px;accent-color:#3a5a3a;";
const yrLbl = document.createElement("span");
yrLbl.style.cssText = "font-size:14px;font-weight:bold;color:#3a5a3a;min-width:44px;";
ctrls.append(btn, scrub, yrLbl);
const chartDiv = document.createElement("div");

let yi = 0, timer = null;
function render(i) {
  yrLbl.textContent = YEARS[i];
  scrub.value = i;
  const visible = pts.filter(d => d.year <= YEARS[i]);
  const tips = pts.filter(d => d.year === YEARS[i]);
  chartDiv.innerHTML = "";
  chartDiv.appendChild(Plot.plot({
    width: 420, height: 300,
    color: {legend: true},
    x: {label: "年份", domain: YEARS, tickFormat: d => String(d)},
    y: {label: "每坪均價（萬元）", tickFormat: d => (d/1e4).toFixed(0)},
    marks: [
      Plot.line(visible, {x: "year", y: "med", stroke: "district", strokeWidth: 1.8, tip: true}),
      Plot.dot(tips, {x: "year", y: "med", stroke: "district", fill: "white", r: 4, strokeWidth: 2}),
    ],
  }));
}
function stop() {clearInterval(timer); timer = null; btn.textContent = "▶ Play";}
function play() {
  if (timer) return;
  if (yi >= YEARS.length - 1) yi = 0;
  btn.textContent = "⏸ Pause";
  timer = setInterval(() => {yi++; render(yi); if (yi >= YEARS.length - 1) stop();}, 900);
}
btn.addEventListener("click", () => timer ? stop() : play());
scrub.addEventListener("input", () => {stop(); yi = +scrub.value; render(yi);});
render(0);
container.append(ctrls, chartDiv);
return container;
${T}`,
  },

  // ── 12. Observable: linked multi-chart filtering ──────────────────────────
  {
    title: "連結多圖篩選",
    note: "研究問題：捷運溢價——捷運站越多房價越高嗎？住宅大樓與公寓有差異嗎？點擊建物型態按鈕，散佈圖與均價長條圖同步更新。",
    code: `${T}observable
const SAMPLE_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Ffedb5a43-7a51-4af4-b35c-983ff2fbfc4f_house_price_sample.csv?alt=media&token=bf34c94c-9969-459e-b1c3-efec6c703f54";
const raw = await d3.csv(SAMPLE_URL, d => ({
  type: d["建物型態"], mrt: +d["捷運站_500內"], price: +d["單價元/坪"],
  jitter: (Math.random() - 0.5) * 0.45,
}));

const TYPES = ["All", "住宅大樓", "公寓", "華廈"];
let sel = null;

const container = document.createElement("div");
container.style.cssText = "font-family:sans-serif;padding:8px;";
const btnRow = document.createElement("div");
btnRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;";
const btns = {};
for (const t of TYPES) {
  const b = document.createElement("button");
  b.textContent = t;
  b.style.cssText = "padding:3px 10px;font-size:12px;border-radius:4px;cursor:pointer;border:1.5px solid #3a5a3a;";
  b.addEventListener("click", () => {
    sel = t === "All" ? null : t;
    for (const [k, el] of Object.entries(btns)) {
      el.style.background = k === (sel || "All") ? "#3a5a3a" : "white";
      el.style.color = k === (sel || "All") ? "white" : "#3a5a3a";
    }
    draw();
  });
  btns[t] = b; btnRow.appendChild(b);
}
btns["All"].style.background = "#3a5a3a"; btns["All"].style.color = "white";
for (const [k, el] of Object.entries(btns)) if (k !== "All") { el.style.background = "white"; el.style.color = "#3a5a3a"; }

const charts = document.createElement("div");
function draw() {
  const vis = sel ? raw.filter(d => d.type === sel) : raw;
  const bdata = Array.from(
    d3.rollup(vis, v => d3.mean(v, d => d.price), d => Math.min(d.mrt, 5)).entries()
  ).map(([k, avg]) => ({k, avg, label: k < 5 ? String(k) : "5+"})).sort((a, b) => a.k - b.k);
  charts.innerHTML = "";
  charts.appendChild(Plot.plot({
    width: 400, height: 220,
    marks: [Plot.dot(vis, {x: d => d.mrt + d.jitter, y: "price", r: 2.5, fill: "#3a5a3a", fillOpacity: .25})],
    x: {label: "捷運站數（500m 內）→", domain: [-0.6, 5.6]},
    y: {label: "每坪單價（元）", domain: [0, 1500000]},
  }));
  charts.appendChild(Plot.plot({
    width: 400, height: 180,
    marks: [
      Plot.barY(bdata, {x: "label", y: "avg", fill: "#3a5a3a", fillOpacity: .8, tip: true}),
      Plot.ruleY([0]),
    ],
    x: {label: "捷運站數（5+ 為上限）→"},
    y: {label: "均價（元）", tickFormat: d => (d/1e4).toFixed(0)+"萬"},
  }));
}
draw();
container.append(btnRow, charts);
return container;
${T}`,
  },

  // ── 13. Observable: heatmap ────────────────────────────────────────────────
  {
    title: "熱力矩陣",
    note: "研究問題：房市季節性——哪幾個月成交最熱？三個城市的淡旺季一樣嗎？顏色深淺代表 2019–2024 年各月累積成交量，格內數字為實際筆數。",
    code: `${T}observable
const MONTHLY_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Fd41a58ae-0e81-404e-af88-276c50de79db_house_price_monthly.csv?alt=media&token=ee4fdd3d-1554-47c9-a847-371a04414fd0";
const raw = await d3.csv(MONTHLY_URL, d => ({
  city: d["縣市"], month: +d["月"], count: +d["count"]
}));

// 六年累計：每 (縣市 × 月份) 合計成交量
const cells = [];
for (const [city, months] of d3.rollup(
  raw, v => d3.sum(v, d => d.count), d => d.city, d => d.month
))
  for (const [month, total] of months)
    cells.push({city, month, total});

return Plot.plot({
  width: 400, height: 200,
  color: {scheme: "Greens", legend: true, label: "成交量"},
  marks: [
    Plot.cell(cells, {x: "month", y: "city", fill: "total", inset: 1, tip: true}),
    Plot.text(cells, {
      x: "month", y: "city",
      text: d => d3.format(",")(d.total),
      fontSize: 9,
      fill: d => d.total > 1500 ? "white" : "#333",
    }),
  ],
  x: {label: "月份 →", tickFormat: d => d+"月"},
  y: {label: null},
});
${T}`,
  },

  // ── 14. Observable: bubble chart ──────────────────────────────────────────
  {
    title: "泡泡圖",
    note: "研究問題：各行政區房市全貌——均價（X 軸）、平均坪數（Y 軸）、成交量（泡泡大小）三維一圖，顏色代表縣市，行政區名稱直接標示於泡泡上。",
    code: `${T}observable
const SAMPLE_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Ffedb5a43-7a51-4af4-b35c-983ff2fbfc4f_house_price_sample.csv?alt=media&token=bf34c94c-9969-459e-b1c3-efec6c703f54";
const raw = await d3.csv(SAMPLE_URL, d => ({
  city: d["縣市"], district: d["鄉鎮市區"],
  price: +d["單價元/坪"], area: +d["建物移轉總面積平方公尺"],
}));
const agg = Array.from(
  d3.group(raw, d => d.district),
  ([district, rows]) => ({
    district,
    city: rows[0].city,
    avgPrice: d3.mean(rows, d => d.price),
    count: rows.length,
    avgPing: d3.mean(rows, d => d.area) / 3.305,
  })
);
return Plot.plot({
  width: 420, height: 340,
  color: {legend: true},
  r: {range: [12, 22]},
  marks: [
    Plot.dot(agg, {
      x: "avgPrice", y: "avgPing",
      r: "count", fill: "city",
      fillOpacity: .75, tip: true,
    }),
    Plot.text(agg, {
      x: "avgPrice", y: "avgPing",
      text: "district",
      fontSize: 9, fill: "white", fontWeight: "bold",
    }),
  ],
  x: {label: "每坪均價（萬元）→", tickFormat: d => (d/1e4).toFixed(0)},
  y: {label: "↑ 平均坪數（坪）", tickFormat: d => d.toFixed(0)},
});
${T}`,
  },

  // ── 15. Observable: box plot ──────────────────────────────────────────────
  {
    title: "箱形圖",
    note: "研究問題：各建物類型的房價帶寬——住宅大樓與公寓的價格離散程度有何不同？箱形圖顯示中位數、四分位距與離群值，y 軸上限 150 萬以壓縮極端值。",
    code: `${T}observable
const SAMPLE_URL =
  "https://firebasestorage.googleapis.com/v0/b/course-final-paper-website-tst.firebasestorage.app/o/reports%2FvjqjxFH2pYktaM10BfNm_8KtVLYsKtROF6yfFKcEew97JKhe2%2F8KtVLYsKtROF6yfFKcEew97JKhe2%2Ffedb5a43-7a51-4af4-b35c-983ff2fbfc4f_house_price_sample.csv?alt=media&token=bf34c94c-9969-459e-b1c3-efec6c703f54";
const raw = await d3.csv(SAMPLE_URL, d => ({
  type: d["建物型態"], price: +d["單價元/坪"]
}));

// 保留數量最多的前五種建物型態
const top5 = Array.from(d3.rollup(raw, v => v.length, d => d.type).entries())
  .sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => d[0]);
const data = raw.filter(d => top5.includes(d.type));

return Plot.plot({
  width: 400, height: 300,
  marks: [
    Plot.boxY(data, {x: "type", y: "price", fill: "#3a5a3a", fillOpacity: .6}),
  ],
  y: {label: "每坪單價（元）", domain: [0, 1500000], tickFormat: d => (d/1e4).toFixed(0)+"萬"},
  x: {label: null},
});
${T}`,
  },
];

function CheatsheetRow({ section }: { section: Section }) {
  const [code, setCode] = React.useState(section.code);
  const preview = useDebounced(code, 500);

  return (
    <div className="space-y-3">
      <div>
        <div className="font-serif text-base font-semibold">{section.title}</div>
        {section.note && (
          <p className="text-muted mt-0.5 font-serif text-sm leading-relaxed">{section.note}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Left: scrollable source — height is capped to the right side's rendered height */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="border-border bg-canvas text-foreground focus:border-accent h-full min-h-[80px] w-full resize-none overflow-y-auto rounded border p-3 font-mono text-xs leading-relaxed focus:outline-none"
        />
        {/* Right: live preview — determines the row height */}
        <div className="border-border min-h-[80px] overflow-auto rounded border p-4">
          <MarkdownRenderer content={preview} className="text-sm" />
        </div>
      </div>
    </div>
  );
}

const MARKDOWN_SECTIONS = SECTIONS.slice(0, 6);
const OBSERVABLE_SECTIONS = SECTIONS.slice(6);

export function MarkdownCheatsheet() {
  return (
    <section>
      <div className="text-2xs text-subtle mb-2 font-mono uppercase tracking-[0.12em]">
        語法指南
      </div>
      <h2 className="font-serif text-2xl font-semibold tracking-tight">Markdown 語法教學</h2>
      <p className="text-muted mt-1 mb-8 font-serif text-base">
        以下範例皆可直接編輯，右側即時顯示渲染結果。
      </p>
      <div className="space-y-10">
        {MARKDOWN_SECTIONS.map((s, i) => (
          <div key={i} className="border-border border-t pt-8 first:border-t-0 first:pt-0">
            <CheatsheetRow section={s} />
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-border pt-12">
        <div className="text-2xs text-subtle mb-2 font-mono uppercase tracking-[0.12em]">
          互動圖表
        </div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Observable 互動式圖表語法教學
        </h2>
        <p className="text-muted mt-1 font-serif text-base">
          使用{" "}
          <code className="bg-surface border-border rounded border px-1 py-0.5 font-mono text-sm">
            ```observable
          </code>{" "}
          撰寫 JavaScript 程式碼區塊，即可使用{" "}
          <a
            href="https://observablehq.com/plot/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-[3px]"
          >
            Observable Plot
          </a>{" "}
          與{" "}
          <a
            href="https://d3js.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-[3px]"
          >
            D3.js
          </a>{" "}
          等函式庫來建立互動式圖表。
        </p>
        <p className="text-muted mt-1 mb-8 font-serif text-base">
          以下範例使用 Kaggle 資料集{" "}
          <a
            href="https://www.kaggle.com/datasets/sunny9999/house-price-taipei?resource=download"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-[3px]"
          >
            台灣北北桃一日生活圈房價預測
          </a>{" "}
          作為示範資料。Observable 能畫的圖表不限於以下範例，有任何需求可以直接請 AI
          幫忙寫寫看，有遇到任何問題或想畫的圖表畫不出來歡迎在 NTU COOL
          討論串回報給我～（劉峻瑋，r14325004@ntu.edu.tw）
        </p>
        <div className="space-y-10">
          {OBSERVABLE_SECTIONS.map((s, i) => (
            <div key={i} className="border-border border-t pt-8 first:border-t-0 first:pt-0">
              <CheatsheetRow section={s} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
