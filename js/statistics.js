// =========================================
// AgriConnect SA - Statistics page
// =========================================

// Marketplace data (prices as shown on products.html)
const MARKET = [
  { name: "Fresh Maize",    category: "Vegetables", price: 120,    rating: 5 },
  { name: "Tomatoes",       category: "Vegetables", price: 250,    rating: 5 },
  { name: "Spinach",        category: "Vegetables", price: 30,     rating: 4 },
  { name: "Apples",         category: "Fruit",      price: 80,     rating: 5 },
  { name: "Oranges",        category: "Fruit",      price: 70,     rating: 5 },
  { name: "Mangoes",        category: "Fruit",      price: 120,    rating: 4 },
  { name: "Live Chickens",  category: "Livestock",  price: 150,    rating: 5 },
  { name: "Goats",          category: "Livestock",  price: 2800,   rating: 5 },
  { name: "Tractor",        category: "Equipment",  price: 450000, rating: 5 },
  { name: "Fertiliser",     category: "Equipment",  price: 350,    rating: 4 },
  { name: "Maize Seeds",    category: "Equipment",  price: 220,    rating: 5 },
  { name: "Irrigation Kit", category: "Equipment",  price: 4500,   rating: 5 }
];

const CATEGORIES = ["Vegetables", "Fruit", "Livestock", "Equipment"];
const COLORS = { Vegetables: "#2e7d32", Fruit: "#C7632B", Livestock: "#8A8B3C", Equipment: "#4F7CAC" };
const RATING_COLORS = { 5: "#2e7d32", 4: "#8A8B3C", 3: "#E0A526", 2: "#C7632B", 1: "#B3392F" };

const $ = id => document.getElementById(id);
const charts = {};

// ---------- Optional farmer-dashboard listings ----------
function farmerListings() {
  try {
    const raw = JSON.parse(localStorage.getItem("farmerProducts")) || [];
    return raw
      .map(p => ({ name: p.name + " (yours)", category: p.category, price: parseFloat(p.price), rating: null }))
      .filter(p => p.name && CATEGORIES.includes(p.category) && isFinite(p.price));
  } catch (e) { return []; }
}

// ---------- Statistics helpers ----------
const sum = a => a.reduce((s, x) => s + x, 0);
const mean = a => sum(a) / a.length;

function quantile(sorted, q) {            // linear interpolation (Excel QUARTILE.INC)
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function modes(a) {
  const counts = new Map();
  a.forEach(x => counts.set(x, (counts.get(x) || 0) + 1));
  const max = Math.max(...counts.values());
  if (max === 1) return { values: [], freq: 1 };
  return { values: [...counts].filter(([, c]) => c === max).map(([v]) => v).sort((x, y) => x - y), freq: max };
}

function describe(values) {
  const n = values.length;
  if (!n) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = mean(s);
  const variance = n > 1 ? sum(s.map(x => (x - m) ** 2)) / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  const q1 = quantile(s, 0.25), q2 = quantile(s, 0.5), q3 = quantile(s, 0.75);
  let skew = null;
  if (n > 2 && sd > 0) {
    skew = (n / ((n - 1) * (n - 2))) * sum(s.map(x => ((x - m) / sd) ** 3));
  }
  return {
    n, total: sum(s), mean: m, median: q2, mode: modes(s),
    min: s[0], max: s[n - 1], range: s[n - 1] - s[0],
    q1, q3, iqr: q3 - q1, variance, sd,
    cv: m !== 0 ? (sd / m) * 100 : null, skew
  };
}

// ---------- Formatting ----------
const num = (x, d = 2) => x.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: d });
function fmt(x, metric, d = 2) {
  if (x === null || x === undefined || !isFinite(x)) return "n/a";
  return metric === "price" ? "R" + num(x, d) : num(x, d) + " ★";
}

// ---------- Current selection ----------
function getState() {
  const metric = $("metric").value;
  const cat = $("category").value;
  let rows = MARKET.map(r => ({ ...r }));
  if ($("useFarmer").checked) rows = rows.concat(farmerListings());
  if (cat !== "all") rows = rows.filter(r => r.category === cat);
  if (metric === "rating") rows = rows.filter(r => r.rating !== null);

  const vals = rows.map(r => r[metric]);
  let lo = -Infinity, hi = Infinity;
  if (vals.length >= 4) {
    const s = [...vals].sort((a, b) => a - b);
    const q1 = quantile(s, 0.25), q3 = quantile(s, 0.75), i = q3 - q1;
    lo = q1 - 1.5 * i; hi = q3 + 1.5 * i;
  }
  rows.forEach(r => r.outlier = r[metric] < lo || r[metric] > hi);
  const used = $("noOutliers").checked ? rows.filter(r => !r.outlier) : rows;
  return { metric, cat, rows, used };
}

// ---------- Render: statistic cards ----------
function renderStats(st) {
  const d = describe(st.used.map(r => r[st.metric]));
  const grid = $("statGrid");
  if (!d) { grid.innerHTML = '<p class="insight">No data for this selection.</p>'; $("insight").textContent = ""; return; }
  const m = st.metric;
  const modeText = d.mode.values.length ? d.mode.values.map(v => fmt(v, m)).join(", ") : "No mode";
  const modeHint = d.mode.values.length ? `appears ${d.mode.freq}×` : "all values are unique";

  const cards = [
    ["Count", num(d.n, 0), "products", false],
    ["Mean", fmt(d.mean, m), "average", true],
    ["Median", fmt(d.median, m), "middle value", true],
    ["Mode", modeText, modeHint, true],
    ["Minimum", fmt(d.min, m), "", false],
    ["Maximum", fmt(d.max, m), "", false],
    ["Range", fmt(d.range, m), "max − min", false],
    ["Q1 (25%)", fmt(d.q1, m), "", false],
    ["Q3 (75%)", fmt(d.q3, m), "", false],
    ["IQR", fmt(d.iqr, m), "Q3 − Q1", false],
    ["Variance", m === "price" ? num(d.variance, 0) + " R²" : num(d.variance, 3), "sample (n − 1)", false],
    ["Std deviation", fmt(d.sd, m), "sample (n − 1)", true],
    ["Coeff. of variation", d.cv === null ? "n/a" : num(d.cv, 1) + "%", "sd ÷ mean", false],
    ["Skewness", d.skew === null ? "n/a" : num(d.skew, 2), d.skew === null ? "" : d.skew > 0.5 ? "tail of high values" : d.skew < -0.5 ? "tail of low values" : "fairly symmetric", false]
  ];
  if (m === "price") cards.splice(1, 0, ["Total value", fmt(d.total, m, 0), "sum of prices", false]);

  grid.innerHTML = cards.map(([l, v, h, k]) =>
    `<div class="stat${k ? " key" : ""}"><div class="label">${l}</div><div class="value">${v}</div><div class="hint">${h}</div></div>`
  ).join("");

  // Plain-English insight
  let text = `Based on ${d.n} product${d.n === 1 ? "" : "s"}. `;
  if (d.n < 2) text += "Add more data to see spread statistics.";
  else if (d.median > 0 && d.mean / d.median >= 2 && m === "price")
    text += `The mean (${fmt(d.mean, m, 0)}) is ${num(d.mean / d.median, 1)}× the median (${fmt(d.median, m, 0)}), so a few expensive items are pulling the average up. The median describes a typical product better here. Try "Exclude outliers" to see the difference.`;
  else if (Math.abs(d.mean - d.median) <= 0.1 * Math.max(Math.abs(d.mean), 1e-9))
    text += "The mean and median are close together, so the values are fairly evenly distributed.";
  else text += `The mean (${fmt(d.mean, m)}) and median (${fmt(d.median, m)}) differ noticeably, which suggests the data is skewed.`;
  const out = st.rows.filter(r => r.outlier).map(r => r.name);
  if (out.length) text += ` Outlier${out.length > 1 ? "s" : ""} detected: ${out.join(", ")}${$("noOutliers").checked ? " (excluded)" : ""}.`;
  $("insight").textContent = text;
}

// ---------- Render: data table ----------
function renderTable(st) {
  $("dataBody").innerHTML = st.rows.map(r => {
    const dim = $("noOutliers").checked && r.outlier ? "dim" : "";
    return `<tr class="${dim}"><td>${r.name}</td><td>${r.category}</td>
      <td>${num(r.price, 2)}</td><td>${r.rating ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "–"}</td>
      <td>${r.outlier ? '<span class="pill">Outlier</span>' : ""}</td></tr>`;
  }).join("");
}

// ---------- Render: charts ----------
function themeColors() {
  const dark = document.body.classList.contains("dark");
  return { text: dark ? "#e8e6e0" : "#222", grid: dark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.08)", edge: dark ? "#1f2420" : "#fff" };
}

function draw(key, canvasId, config) {
  if (charts[key]) charts[key].destroy();
  charts[key] = new Chart($(canvasId), config);
}

function renderCharts(st) {
  const t = themeColors();
  Chart.defaults.font.family = "Poppins, sans-serif";
  Chart.defaults.color = t.text;

  const pieOpts = (extra = {}) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: t.text, padding: 14 } },
      tooltip: { callbacks: { label: c => {
        const total = c.dataset.data.reduce((a, b) => a + b, 0);
        return ` ${c.label}: ${c.parsed} (${(c.parsed / total * 100).toFixed(1)}%)`;
      } } },
      ...extra
    }
  });

  // 1. Pie: listings by category (whole marketplace + optional farmer listings)
  const all = MARKET.concat($("useFarmer").checked ? farmerListings() : []);
  const catCounts = CATEGORIES.map(c => all.filter(r => r.category === c).length);
  draw("cat", "pieCategory", {
    type: "pie",
    data: { labels: CATEGORIES, datasets: [{ data: catCounts, backgroundColor: CATEGORIES.map(c => COLORS[c]), borderColor: t.edge, borderWidth: 2 }] },
    options: pieOpts()
  });

  // 2. Doughnut: rating distribution for current selection
  const rated = st.rows.filter(r => r.rating !== null);
  const stars = [5, 4, 3, 2, 1].filter(s => rated.some(r => r.rating === s));
  $("ratingTitle").textContent = "Rating distribution" + (st.cat === "all" ? "" : " – " + st.cat);
  draw("rating", "pieRating", {
    type: "doughnut",
    data: { labels: stars.map(s => s + " ★"), datasets: [{ data: stars.map(s => rated.filter(r => r.rating === s).length), backgroundColor: stars.map(s => RATING_COLORS[s]), borderColor: t.edge, borderWidth: 2 }] },
    options: pieOpts()
  });

  // 3. Bar: value per product, with mean & median lines
  const isPrice = st.metric === "price";
  $("barTitle").textContent = (isPrice ? "Price" : "Rating") + " per product";
  $("logScale").parentElement.hidden = !isPrice;
  const rows = st.used.slice().sort((a, b) => b[st.metric] - a[st.metric]);
  const d = describe(rows.map(r => r[st.metric]));
  const lineData = v => rows.map(() => v);
  const log = isPrice && $("logScale").checked;

  draw("bar", "barChart", {
    data: {
      labels: rows.map(r => r.name),
      datasets: [
        { type: "bar", label: isPrice ? "Price (R)" : "Rating", data: rows.map(r => r[st.metric]),
          backgroundColor: rows.map(r => COLORS[r.category]), borderRadius: 6, order: 3 },
        ...(d ? [
          { type: "line", label: "Mean", data: lineData(d.mean), borderColor: "#E0A526", borderDash: [6, 4], pointRadius: 0, borderWidth: 2, order: 1 },
          { type: "line", label: "Median", data: lineData(d.median), borderColor: "#B3392F", pointRadius: 0, borderWidth: 2, order: 2 }
        ] : [])
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: t.text }, grid: { display: false } },
        y: {
          type: log ? "logarithmic" : "linear", min: log ? 10 : 0, max: isPrice ? undefined : 5,
          ticks: { color: t.text, callback: v => isPrice ? "R" + num(v, 0) : v },
          grid: { color: t.grid }
        }
      },
      plugins: {
        legend: { labels: { color: t.text, filter: i => i.datasetIndex > 0 } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fmt(c.parsed.y, st.metric)}` } }
      }
    }
  });
}

// ---------- Main ----------
function update() {
  const st = getState();
  renderStats(st);
  renderTable(st);
  renderCharts(st);
}

(function init() {
  const f = farmerListings().length;
  if (f) { $("farmerWrap").hidden = false; $("farmerCount").textContent = f; }
  ["metric", "category", "noOutliers", "useFarmer", "logScale"].forEach(id => $(id).addEventListener("change", update));
  new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  update();
})();
