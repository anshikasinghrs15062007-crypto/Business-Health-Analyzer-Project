import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, BarChart3, LayoutGrid, Upload, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const NAV: { title: string; url: string; icon: LucideIcon }[] = [
  { title: "Overview", url: "/", icon: LayoutGrid },
  { title: "Data Import", url: "/dashboard", icon: Upload },
  { title: "Reports", url: "/dashboard", icon: BarChart3 },
];

export function AppShell({ title, status, actions, children }: { title: string; status?: string; actions?: ReactNode; children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Icon rail */}
      <aside className="sticky top-0 flex h-screen w-20 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-8">
        <Link to="/" aria-label="Business Health Analyzer" className="mb-10 text-sidebar-primary">
          <Activity className="h-8 w-8" />
        </Link>
        <nav className="flex flex-col gap-6">
          {NAV.map((item) => {
            const active = item.url === "/" ? path === "/" : path.startsWith(item.url);
            return (
              <Link
                key={item.title}
                to={item.url}
                title={item.title}
                aria-label={item.title}
                className={`rounded-lg p-2 transition-colors ${
                  active
                    ? "bg-sidebar-primary/15 text-sidebar-primary"
                    : "text-sidebar-foreground/40 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-6 w-6" />
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-8">
          <h1 className="font-display text-lg font-bold tracking-tight">{title}</h1>
          <div className="flex items-center gap-4">
            {status && (
              <span className="rounded bg-secondary px-2 py-1 text-xs font-semibold text-muted-foreground">
                Status: {status}
              </span>
            )}
            {actions}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
