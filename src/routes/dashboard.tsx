import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Activity, CheckCircle2, AlertTriangle, Info, Upload, Download, Sparkles, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Button } from "@/components/ui/button";
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

function Dashboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
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
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold"><Activity className="h-5 w-5 text-primary" /> <span className="hidden sm:inline">Business Health Analyzer</span></Link>
          {data && <Button size="sm" onClick={() => input.current?.click()}><Upload className="mr-1 h-4 w-4" /> New file</Button>}
        </div>
      </header>
      <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {msg && (
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${msg.ok ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}>
            {msg.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
            <span className="flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)} aria-label="Dismiss"><X className="h-4 w-4 opacity-60" /></button>
          </div>
        )}

        {!data ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
            className="flex flex-col items-center rounded-2xl border-2 border-dashed border-primary/30 bg-card p-10 text-center shadow-card sm:p-16"
          >
            <div className="rounded-full bg-accent p-4"><Upload className="h-8 w-8 text-primary" /></div>
            <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Upload your sales data</h1>
            <p className="mt-2 max-w-md text-muted-foreground">Drag a CSV file here or choose one. Required columns:</p>
            <div className="mt-4 flex max-w-lg flex-wrap justify-center gap-2">
              {REQUIRED.map((c) => <span key={c} className="rounded-md bg-secondary px-2 py-1 font-mono text-xs">{c}</span>)}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => input.current?.click()}>Choose CSV file</Button>
              <Button size="lg" variant="outline" onClick={() => load(sampleCsv(), "Sample data")}><Sparkles className="mr-1 h-4 w-4" /> Use sample data</Button>
            </div>
            <button onClick={downloadSample} className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"><Download className="h-4 w-4" /> Download sample CSV</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[["Total Sales", money(data.totalSales)], ["Total Profit", money(data.totalProfit)], ["Total Orders", data.orders.toLocaleString()], ["Avg Order Value", money(data.aov)], ["Total Customers", data.customers.toLocaleString()]].map(([k, v]) => (
                <div key={k} className="rounded-xl border bg-card p-5 shadow-card">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</div>
                  <div className="mt-2 font-display text-2xl font-bold">{v}</div>
                </div>
              ))}
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
      </main>
    </div>
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
      <div className="mt-5 space-y-3">
        {parts.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v.toFixed(0)}/25</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: pct(v / 25) }} /></div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
