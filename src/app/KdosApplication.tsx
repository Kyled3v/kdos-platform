import { useState } from "react";

type Module =
  | "dashboard"
  | "company"
  | "users"
  | "operations"
  | "tasks"
  | "projects"
  | "workflows"
  | "documents"
  | "knowledge"
  | "activity"
  | "notifications"
  | "settings";

const modules: Array<{
  id: Module;
  label: string;
}> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "company", label: "Company" },
  { id: "users", label: "Users" },
  { id: "operations", label: "Operations" },
  { id: "tasks", label: "Tasks" },
  { id: "projects", label: "Projects" },
  { id: "workflows", label: "Workflows" },
  { id: "documents", label: "Documents" },
  { id: "knowledge", label: "Knowledge" },
  { id: "activity", label: "Activity" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
];

function ModulePage({ module }: { module: Module }) {
  const title =
    modules.find((item) => item.id === module)?.label ?? "Dashboard";

  if (module === "dashboard") {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm text-zinc-500">KDOS</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Central operational overview.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            ["Active Tasks", "0"],
            ["Projects", "0"],
            ["Team Members", "0"],
            ["Open Workflows", "0"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-medium text-white">
            System overview
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            KDOS is ready for operational modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-zinc-500">KDOS Module</p>

      <h1 className="mt-1 text-3xl font-semibold text-white">
        {title}
      </h1>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-zinc-500">
          {title} module initialized.
        </p>

        <p className="mt-2 text-sm text-zinc-600">
          Functional implementation will be added to this module.
        </p>
      </div>
    </div>
  );
}

export function KdosApplication(): JSX.Element {
  const [activeModule, setActiveModule] =
    useState<Module>("dashboard");

  return (
    <div className="flex min-h-screen bg-[#0A0A0B] text-white">
      <aside className="flex w-64 flex-col border-r border-white/10 bg-[#111113]">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="text-lg font-semibold tracking-tight">
            KDOS
          </div>

          <div className="mt-1 text-xs text-zinc-600">
            KyleDev Operating System
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {modules.map((item) => {
            const active = activeModule === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                className={[
                  "w-full rounded-lg px-3 py-2.5 text-left text-sm transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="text-xs text-zinc-600">
            KDOS 2.0
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0D0D0F] px-8">
          <div className="text-sm text-zinc-500">
            {modules.find((item) => item.id === activeModule)?.label}
          </div>

          <div className="text-xs text-zinc-600">
            System Online
          </div>
        </header>

        <section className="p-8">
          <ModulePage module={activeModule} />
        </section>
      </main>
    </div>
  );
}


