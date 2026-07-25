import { useAppStore } from "@/stores/AppStore";

export function DashboardPage() {
  const currentWorkspace = useAppStore((state) => state.currentWorkspace);
  const installedModules = useAppStore((state) => state.installedModules);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-primary">
          {currentWorkspace?.name ?? "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">Operating system overview.</p>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-panel/60 p-6 shadow-panel backdrop-blur-glass">
        <p className="text-sm text-ink-secondary">
          {installedModules.length === 0
            ? "No modules installed yet."
            : `${installedModules.length} module(s) installed.`}
        </p>
      </div>
    </div>
  );
}

