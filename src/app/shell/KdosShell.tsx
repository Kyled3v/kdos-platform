import { useState } from "react";

import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Network,
  Settings,
  Users,
} from "lucide-react";

type NavigationItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: typeof LayoutDashboard;
};

const navigation: NavigationItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: BriefcaseBusiness,
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: Users,
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Network,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
  },
];

export function KdosShell(): JSX.Element {
  const [collapsed, setCollapsed] =
    useState(false);

  const [active, setActive] =
    useState("overview");

  return (
    <div className="flex h-screen overflow-hidden bg-kdos-bg text-kdos-text">
      <aside
        className={[
          "relative flex h-full shrink-0 flex-col",
          "border-r border-kdos-border",
          "bg-kdos-sidebar",
          "transition-[width] duration-200 ease-out",
          collapsed ? "w-[76px]" : "w-[248px]",
        ].join(" ")}
      >
        <div className="flex h-[76px] items-center border-b border-kdos-border px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kdos-brand">
              <span className="text-sm font-bold tracking-tight text-white">
                KD
              </span>
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-wide">
                  KDOS
                </div>

                <div className="truncate text-[11px] text-kdos-muted">
                  KyleDev Operating System
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-kdos-muted">
            {!collapsed && "Workspace"}
          </div>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={[
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-left text-sm transition-colors",
                    selected
                      ? "bg-kdos-brand/12 text-kdos-accent"
                      : "text-kdos-secondary hover:bg-white/[0.04] hover:text-kdos-text",
                  ].join(" ")}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className="shrink-0"
                  />

                  {!collapsed && (
                    <>
                      <span className="flex-1">
                        {item.label}
                      </span>

                      {selected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-kdos-accent" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-kdos-border p-3">
          <button
            type="button"
            title={collapsed ? "Settings" : undefined}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-kdos-secondary transition-colors hover:bg-white/[0.04] hover:text-kdos-text"
          >
            <Settings
              size={18}
              strokeWidth={1.8}
            />

            {!collapsed && <span>Settings</span>}
          </button>

          <div className="mt-2 flex items-center gap-3 rounded-lg border border-kdos-border bg-white/[0.02] p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kdos-brand text-xs font-semibold text-white">
              KD
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">
                  KDOS Administrator
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-kdos-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-kdos-success" />
                  System active
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-3 top-[62px] flex h-6 w-6 items-center justify-center rounded-full border border-kdos-border bg-kdos-panel text-kdos-muted shadow-sm transition-colors hover:text-kdos-text"
          aria-label={
            collapsed
              ? "Expand navigation"
              : "Collapse navigation"
          }
        >
          {collapsed ? (
            <ChevronRight size={13} />
          ) : (
            <ChevronLeft size={13} />
          )}
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <header className="flex h-[76px] items-center justify-between border-b border-kdos-border bg-kdos-bg/95 px-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-kdos-muted">
              KDOS
            </div>

            <h1 className="mt-1 text-lg font-semibold">
              {navigation.find(
                (item) => item.id === active,
              )?.label ?? "Overview"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-kdos-border bg-kdos-panel px-3 py-2 text-xs text-kdos-muted md:flex">
              <Activity size={14} />
              System operational
            </div>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-kdos-border bg-kdos-panel text-kdos-secondary transition-colors hover:text-kdos-text"
              title="System performance"
            >
              <Gauge size={17} />
            </button>
          </div>
        </header>

        <section className="p-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="System status"
                value="Operational"
                detail="All core services running"
                tone="success"
              />

              <MetricCard
                label="Active projects"
                value="12"
                detail="3 require attention"
                tone="brand"
              />

              <MetricCard
                label="Open tasks"
                value="47"
                detail="8 due today"
                tone="brand"
              />

              <MetricCard
                label="Workforce"
                value="18"
                detail="14 active workers"
                tone="success"
              />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
              <section className="rounded-xl border border-kdos-border bg-kdos-panel p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">
                      Operational overview
                    </h2>

                    <p className="mt-1 text-xs text-kdos-muted">
                      Current KDOS activity
                    </p>
                  </div>

                  <span className="rounded-md border border-kdos-border px-2.5 py-1 text-[10px] font-medium text-kdos-secondary">
                    Live
                  </span>
                </div>

                <div className="mt-8 h-56 rounded-lg border border-kdos-border bg-kdos-bg p-5">
                  <div className="flex h-full items-end gap-2">
                    {[38, 52, 46, 65, 57, 72, 64, 81, 68, 88, 76, 92].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-sm bg-gradient-to-t from-kdos-brand/20 to-kdos-accent/70"
                          style={{ height: `${height}%` }}
                        />
                      ),
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-kdos-border bg-kdos-panel p-6">
                <h2 className="text-sm font-semibold">
                  Recent activity
                </h2>

                <div className="mt-5 space-y-4">
                  <ActivityRow
                    title="Project updated"
                    detail="KDOS Core"
                    time="4 min ago"
                  />

                  <ActivityRow
                    title="Task completed"
                    detail="Architecture review"
                    time="12 min ago"
                  />

                  <ActivityRow
                    title="Workflow executed"
                    detail="Client onboarding"
                    time="24 min ago"
                  />

                  <ActivityRow
                    title="Report generated"
                    detail="Weekly operations"
                    time="41 min ago"
                  />
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "brand" | "success";
}): JSX.Element {
  return (
    <div className="rounded-xl border border-kdos-border bg-kdos-panel p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-kdos-muted">
          {label}
        </span>

        <span
          className={[
            "h-2 w-2 rounded-full",
            tone === "success"
              ? "bg-kdos-success"
              : "bg-kdos-accent",
          ].join(" ")}
        />
      </div>

      <div className="mt-4 text-2xl font-semibold tracking-tight">
        {value}
      </div>

      <div className="mt-1 text-xs text-kdos-muted">
        {detail}
      </div>
    </div>
  );
}

function ActivityRow({
  title,
  detail,
  time,
}: {
  title: string;
  detail: string;
  time: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-3 border-b border-kdos-border pb-4 last:border-0 last:pb-0">
      <span className="h-2 w-2 rounded-full bg-kdos-accent" />

      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium">
          {title}
        </div>

        <div className="mt-0.5 text-[11px] text-kdos-muted">
          {detail}
        </div>
      </div>

      <span className="text-[10px] text-kdos-muted">
        {time}
      </span>
    </div>
  );
}
