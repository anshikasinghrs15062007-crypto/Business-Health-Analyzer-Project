import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, FileUp, Gauge, Lightbulb, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Business Health Analyzer — Sales insights for small business" },
      { name: "description", content: "Upload your sales CSV and get KPIs, charts, a 100-point health score and actionable recommendations in seconds." },
      { property: "og:title", content: "Business Health Analyzer" },
      { property: "og:description", content: "Turn your sales spreadsheet into a business health score and clear recommendations." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: FileUp, title: "Drop in a CSV", text: "Upload your sales export. We validate columns and rows instantly." },
  { icon: BarChart3, title: "Live dashboards", text: "KPIs plus monthly trends, regions, products, categories and profit." },
  { icon: Gauge, title: "Health score", text: "A 100-point score across revenue, profit, customers and products." },
  { icon: Lightbulb, title: "Smart insights", text: "Plain-language findings and recommendations you can act on today." },
  { icon: ShieldCheck, title: "Private by design", text: "Your file is analyzed in your browser — it never leaves your device." },
  { icon: Activity, title: "Built for owners", text: "No analysts needed. Clear numbers for shops, startups and sales teams." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-hero text-ink-foreground">
        <div className="absolute inset-0 grid-lines" />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 font-display text-lg font-semibold"><Activity className="h-5 w-5 text-primary" /> Business Health Analyzer</div>
          <Button asChild size="sm"><Link to="/dashboard">Open app</Link></Button>
        </header>
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-12 md:grid-cols-2 md:pt-20">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">Sales analytics for small business</p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">Know how healthy your business really is.</h1>
            <p className="mt-6 max-w-lg text-lg opacity-75">Upload your sales data and get KPIs, charts, a health score out of 100 and clear recommendations — in under a minute.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/dashboard">Analyze my data <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
          </div>
          <div className="rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-6 backdrop-blur">
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${0.82 * 314} 314`} />
              </svg>
              <div><div className="font-display text-5xl font-bold">82</div><div className="text-sm opacity-70">Health score · Good</div></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[["Total sales", "$248,310"], ["Profit", "$41,902"], ["Orders", "1,284"], ["Customers", "312"]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-ink-foreground/5 p-3"><div className="text-xs opacity-60">{k}</div><div className="font-display text-xl font-semibold">{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold">Everything you need to read your numbers</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl bg-ink p-10 text-center text-ink-foreground">
          <h2 className="text-2xl font-bold md:text-3xl">Ready for your health check?</h2>
          <p className="opacity-70">No sign-up. Try it with our sample data or your own CSV.</p>
          <Button asChild size="lg"><Link to="/dashboard">Get started</Link></Button>
        </div>
      </section>
    </div>
  );
}
