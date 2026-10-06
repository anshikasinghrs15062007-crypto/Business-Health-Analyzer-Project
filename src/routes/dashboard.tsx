import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, Upload, Download, Sparkles, X, FileUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { analyze, money, parseCsv, pct, REQUIRED, sampleCsv, type Row } from "@/lib/analytics";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Business Health Analyzer" },
      { name: "description", content: "Upload sales data to see KPIs, charts, your business health score and insights." },
      { property: "og:title", content: "Dashboard — Business Health Analyzer" },
      { property: "og:description", content: "Your sales KPIs, charts and health score in one view." },
    ],
  }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };

const KPI_DEFS = [
  { key: "totalSales", label: "Total Sales", hint: "Revenue — the full value of everything sold before costs are deducted." },
  { key: "totalProfit", label: "Total Profit", hint: "What remains after costs. Sales minus expenses; the money you actually keep." },
  { key: "orders", label: "Total Orders", hint: "Number of transactions. One customer buying three times counts as three orders." },
  { key: "aov", label: "Avg Order Value", hint: "AOV — average spend per order. Total sales divided by number of orders." },
  { key: "customers", label: "Total Customers", hint: "Unique buyers in the period. Repeat purchases from one person count once." },
] as const;

const HEALTH_DEFS: Record<string, string> = {
  "Revenue Performance": "Compares sales growth between the first and second half of your period. 20% growth or more earns the full 25 points.",
  "Profitability": "Measures profit margin — profit as a share of sales. A 25% margin earns the full 25 points.",
  "Customer Activity": "Based on average orders per customer. 4+ orders each earns the full 25 points; lower frequency scores less.",
  "Product Performance": "Rewards a profitable product mix: how many products make money, and how evenly revenue is spread across them.",
};

function Dashboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const data = useMemo(() => (rows ? analyze(rows) : null), [rows]);

  const load = (text: string, name: string) => {
    const r = parseCsv(text);
    if (r.error) { setMsg({ ok: false, text: r.error }); return; }
    setRows(r.rows);
    setMsg({ ok: true, text: `${name} uploaded — ${r.rows.length.toLocaleString()} rows analyzed.` });
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) { setMsg({ ok: false, text: "Please upload a .csv file." }); return; }
    load(await f.text(), f.name);
  };
  const downloadSample = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([sampleCsv()], { type: "text/csv" }));
    a.download = "sample-sales.csv"; a.click();
  };

  return (
    <AppShell
      title={data ? "Health Report" : "Data Import"}
      status={data ? "Analyzed" : "Ready"}
      actions={data ? <Button size="sm" onClick={() => input.current?.click()}><Upload className="mr-1 h-4 w-4" /> New file</Button> : undefined}
    >
      <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />

      <div className="mx-auto max-w-6xl space-y-6 p-8 lg:p-12">
        {msg && (
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${msg.ok ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}>
            {msg.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
            <span className="flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)} aria-label="Dismiss"><X className="h-4 w-4 opacity-60" /></button>
          </div>
        )}

        {!data ? (
          <div className="mx-auto max-w-4xl space-y-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Upload your sales data</h2>
              <p className="mt-2 text-muted-foreground">Import your business metrics to generate your real-time Health Score dashboard.</p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]); }}
              className={`group rounded-2xl border-2 border-dashed bg-card p-12 text-center transition-all sm:p-16 ${
                dragging ? "border-primary bg-accent/40" : "border-input hover:border-primary hover:bg-accent/30"
              }`}
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent transition-transform group-hover:scale-110">
                <FileUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Drop CSV file to analyze</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Drag and drop your sales export here, or use our sample dataset to explore.</p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" onClick={() => input.current?.click()}>Choose file</Button>
                <Button size="lg" variant="outline" onClick={() => load(sampleCsv(), "Sample data")}>
                  <Sparkles className="mr-1 h-4 w-4" /> Use sample data
                </Button>
              </div>

              <div className="mt-10 border-t pt-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Required Columns</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {REQUIRED.map((c) => (
                    <span key={c} className="rounded-md border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{c}</span>
                  ))}
                </div>
                <button onClick={downloadSample} className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <Download className="h-3 w-3" /> Download sample.csv
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {KPI_DEFS.map(({ key, label, hint }) => {
                const v = data[key as keyof typeof data];
                return (
                  <div key={key} className="rounded-xl border bg-card p-5 shadow-card">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                    <div className="mt-2 font-display text-2xl font-bold">{key === "orders" || key === "customers" ? (v as number).toLocaleString() : money(v as number)}</div>
                    <p className="mt-2 text-xs leading-snug text-muted-foreground">{hint}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <HealthCard data={data} />
              <Panel title="Business Insights" className="lg:col-span-2">
                <ul className="space-y-3">
                  {data.insights.map((i, n) => (
                    <li key={n} className="flex gap-3 text-sm">
                      {i.tone === "good" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : i.tone === "warn" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                      <span>{i.text}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Monthly Sales Trend">
                <Chart><LineChart data={data.monthly}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} tickFormatter={short} /><Tooltip {...tip} formatter={(v: number) => money(v)} /><Line type="monotone" dataKey="sales" name="Sales" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} /></LineChart></Chart>
              </Panel>
              <Panel title="Profit Analysis">
                <Chart><LineChart data={data.monthly}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} tickFormatter={short} /><Tooltip {...tip} formatter={(v: number) => money(v)} /><Legend /><Line type="monotone" dataKey="profit" name="Profit" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="sales" name="Sales" stroke="var(--chart-3)" strokeDasharray="4 4" dot={false} /></LineChart></Chart>
              </Panel>
              <Panel title="Region-wise Revenue">
                <Chart><BarChart data={data.regions}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} tickFormatter={short} /><Tooltip {...tip} formatter={(v: number) => money(v)} /><Bar dataKey="sales" name="Revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart></Chart>
              </Panel>
              <Panel title="Category Distribution">
                <Chart><PieChart><Tooltip {...tip} formatter={(v: number) => money(v)} /><Legend /><Pie data={data.categories} dataKey="sales" nameKey="name" innerRadius="45%" outerRadius="80%" paddingAngle={2}>{data.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></Chart>
              </Panel>
              <Panel title="Product Performance" className="lg:col-span-2">
                <Chart h={320}><BarChart data={data.products.slice(0, 10)} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke="var(--border)" horizontal={false} /><XAxis type="number" fontSize={12} tickFormatter={short} /><YAxis type="category" dataKey="name" fontSize={12} width={110} /><Tooltip {...tip} formatter={(v: number) => money(v)} /><Legend /><Bar dataKey="sales" name="Sales" fill="var(--chart-1)" radius={[0, 4, 4, 0]} /><Bar dataKey="profit" name="Profit" fill="var(--chart-2)" radius={[0, 4, 4, 0]} /></BarChart></Chart>
              </Panel>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

const short = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`);

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border bg-card p-5 shadow-card ${className}`}><h2 className="mb-4 text-base font-semibold">{title}</h2>{children}</section>;
}
function Chart({ children, h = 260 }: { children: React.ReactElement; h?: number }) {
  return <div style={{ height: h }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

function HealthCard({ data }: { data: ReturnType<typeof analyze> }) {
  const color = data.score >= 90 ? "var(--success)" : data.score >= 75 ? "var(--primary)" : data.score >= 60 ? "var(--warning)" : "var(--destructive)";
  const parts = [["Revenue Performance", data.parts.revenue], ["Profitability", data.parts.profitability], ["Customer Activity", data.parts.customer], ["Product Performance", data.parts.product]] as const;
  return (
    <Panel title="Business Health Score">
      <div className="flex flex-col items-center">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--muted)" strokeWidth="11" />
            <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(data.score / 100) * 314.16} 314.16`} style={{ transition: "stroke-dasharray 1s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold">{data.score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <span className="mt-3 rounded-full px-3 py-1 text-sm font-semibold" style={{ color, background: `color-mix(in oklch, ${color} 12%, transparent)` }}>{data.status}</span>
      </div>
      <div className="mt-5 space-y-4">
        {parts.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v.toFixed(0)}/25</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: pct(v / 25) }} /></div>
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{HEALTH_DEFS[k]}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Each component is scored out of 25 and summed for the total. Benchmarks used: 20% sales growth, 25% profit margin, 4+ orders per customer, and a balanced product mix.
      </p>
    </Panel>
  );
}
