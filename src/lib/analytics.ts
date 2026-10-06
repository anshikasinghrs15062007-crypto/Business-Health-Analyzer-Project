import Papa from "papaparse";

export type Row = {
  date: Date;
  product: string;
  category: string;
  region: string;
  customer: string;
  sales: number;
  profit: number;
  quantity: number;
};

export const REQUIRED = ["Date", "Product", "Category", "Region", "Customer", "Sales", "Profit", "Quantity"];

export function parseCsv(text: string): { rows: Row[]; error?: string } {
  const res = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  const headers = (res.meta.fields ?? []).map((h) => h.toLowerCase());
  const missing = REQUIRED.filter((c) => !headers.includes(c.toLowerCase()));
  if (missing.length) return { rows: [], error: `Missing columns: ${missing.join(", ")}` };
  const get = (r: Record<string, string>, k: string) => {
    const key = Object.keys(r).find((x) => x.toLowerCase() === k.toLowerCase())!;
    return (r[key] ?? "").trim();
  };
  const rows: Row[] = [];
  let bad = 0;
  for (const r of res.data) {
    const date = new Date(get(r, "Date"));
    const sales = parseFloat(get(r, "Sales").replace(/[$,]/g, ""));
    const profit = parseFloat(get(r, "Profit").replace(/[$,]/g, ""));
    const quantity = parseFloat(get(r, "Quantity"));
    if (isNaN(date.getTime()) || isNaN(sales) || isNaN(profit) || isNaN(quantity)) { bad++; continue; }
    rows.push({ date, sales, profit, quantity, product: get(r, "Product") || "Unknown", category: get(r, "Category") || "Unknown", region: get(r, "Region") || "Unknown", customer: get(r, "Customer") || "Unknown" });
  }
  if (!rows.length) return { rows: [], error: "No valid rows found. Check date and number formats." };
  void bad;
  return { rows };
}

export function sampleCsv(): string {
  const products: [string, string, number][] = [
    ["Laptop Pro", "Electronics", 1200], ["Wireless Mouse", "Electronics", 35], ["Office Chair", "Furniture", 240],
    ["Standing Desk", "Furniture", 520], ["Notebook Pack", "Stationery", 12], ["Gel Pens", "Stationery", 8],
    ["Monitor 27\"", "Electronics", 330], ["Bookshelf", "Furniture", 160],
  ];
  const regions = ["North", "South", "East", "West"];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const lines = [REQUIRED.join(",")];
  for (let i = 0; i < 600; i++) {
    const m = Math.floor(rnd() * 12);
    const d = new Date(2025, m, 1 + Math.floor(rnd() * 28));
    const [p, c, price] = products[Math.floor(rnd() * products.length)]!;
    const q = 1 + Math.floor(rnd() * 5);
    const sales = Math.round(price * q * (0.9 + rnd() * 0.2 + m * 0.02));
    const profit = Math.round(sales * (c === "Stationery" ? 0.35 : c === "Furniture" ? 0.18 : 0.12) * (0.4 + rnd()));
    lines.push([d.toISOString().slice(0, 10), `"${p.replace(/"/g, '""')}"`, c, regions[Math.floor(rnd() * 4)], `C${100 + Math.floor(rnd() * 140)}`, sales, profit, q].join(","));
  }
  return lines.join("\n");
}

const sumBy = (rows: Row[], key: (r: Row) => string) => {
  const m = new Map<string, { sales: number; profit: number; qty: number }>();
  for (const r of rows) {
    const k = key(r);
    const v = m.get(k) ?? { sales: 0, profit: 0, qty: 0 };
    v.sales += r.sales; v.profit += r.profit; v.qty += r.quantity;
    m.set(k, v);
  }
  return [...m.entries()].map(([name, v]) => ({ name, ...v }));
};

const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));

export function analyze(rows: Row[]) {
  const totalSales = rows.reduce((s, r) => s + r.sales, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const orders = rows.length;
  const customers = new Set(rows.map((r) => r.customer)).size;
  const aov = totalSales / orders;

  const monthly = sumBy(rows, (r) => `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => ({ ...m, label: new Date(m.name + "-01").toLocaleString("en", { month: "short", year: "2-digit" }), margin: m.sales ? (m.profit / m.sales) * 100 : 0 }));
  const regions = sumBy(rows, (r) => r.region).sort((a, b) => b.sales - a.sales);
  const products = sumBy(rows, (r) => r.product).sort((a, b) => b.sales - a.sales);
  const categories = sumBy(rows, (r) => r.category).sort((a, b) => b.sales - a.sales);
  const custSpend = sumBy(rows, (r) => r.customer);

  // Health score (4 x 25)
  const half = Math.floor(monthly.length / 2);
  const first = monthly.slice(0, half).reduce((s, m) => s + m.sales, 0) / Math.max(half, 1);
  const second = monthly.slice(half).reduce((s, m) => s + m.sales, 0) / Math.max(monthly.length - half, 1);
  const growth = first ? (second - first) / first : 0;
  const revenue = 25 * clamp(0.5 + growth * 2.5); // +20% growth = full
  const margin = totalSales ? totalProfit / totalSales : 0;
  const profitability = 25 * clamp(margin / 0.25); // 25% margin = full
  const repeat = custSpend.filter((c) => c.qty > 0).length ? orders / customers : 0;
  const customer = 25 * clamp((repeat - 1) / 3); // 4+ orders/customer = full
  const profitableProducts = products.filter((p) => p.profit > 0).length / Math.max(products.length, 1);
  const topShare = products[0] ? products[0].sales / totalSales : 1;
  const product = 25 * (0.6 * profitableProducts + 0.4 * clamp((0.6 - topShare) / 0.4));
  const parts = { revenue, profitability, customer, product };
  const score = Math.round(revenue + profitability + customer + product);
  const status = score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 60 ? "Moderate" : "Critical";

  const fmt = money;
  const insights: { tone: "good" | "warn" | "info"; text: string }[] = [];
  if (products[0]) insights.push({ tone: "good", text: `Best-selling product is ${products[0].name} with ${fmt(products[0].sales)} in sales.` });
  if (regions[0]) insights.push({ tone: "good", text: `${regions[0].name} is the top region, generating ${pct(regions[0].sales / totalSales)} of revenue.` });
  const weakRegion = regions[regions.length - 1];
  if (weakRegion && regions.length > 1) insights.push({ tone: "warn", text: `${weakRegion.name} region lags behind at ${pct(weakRegion.sales / totalSales)} of revenue — consider targeted promotions.` });
  const byMargin = [...categories].sort((a, b) => b.profit / b.sales - a.profit / a.sales);
  if (byMargin[0]) insights.push({ tone: "info", text: `${byMargin[0].name} has the highest margin (${pct(byMargin[0].profit / byMargin[0].sales)}). Push more volume here.` });
  if (byMargin.length > 1) { const w = byMargin[byMargin.length - 1]!; insights.push({ tone: "warn", text: `${w.name} has the lowest margin (${pct(w.profit / w.sales)}). Review pricing or supplier costs.` }); }
  insights.push({ tone: growth >= 0 ? "good" : "warn", text: `Average monthly sales ${growth >= 0 ? "grew" : "fell"} ${pct(Math.abs(growth))} in the second half of the period.` });
  const losers = products.filter((p) => p.profit <= 0);
  if (losers.length) insights.push({ tone: "warn", text: `${losers.length} product(s) are unprofitable: ${losers.slice(0, 3).map((l) => l.name).join(", ")}.` });
  if (topShare > 0.4) insights.push({ tone: "warn", text: `${pct(topShare)} of revenue depends on one product. Diversify to reduce risk.` });
  if (repeat < 2) insights.push({ tone: "info", text: `Customers order ${repeat.toFixed(1)}x on average. A loyalty program could lift repeat purchases.` });

  return { totalSales, totalProfit, orders, customers, aov, monthly, regions, products, categories, parts, score, status, insights, margin };
}

export const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2, notation: n >= 1e6 ? "compact" : "standard" }).format(n);
export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
