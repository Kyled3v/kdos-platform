import { useAppStore } from "@/stores/AppStore";

export function SettingsPage() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const version = useAppStore((state) => state.version);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-primary">Settings</h1>
        <p className="mt-1 text-sm text-ink-secondary">Application preferences.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface-panel/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink-primary">Theme</p>
            <p className="text-xs text-ink-secondary">Interface appearance.</p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink-primary transition-colors hover:bg-surface-panel"
          >
            {theme === "dark" ? "Dark" : "Light"}
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-surface-border pt-4">
          <div>
            <p className="text-sm font-medium text-ink-primary">Version</p>
            <p className="text-xs text-ink-secondary">Current application build.</p>
          </div>
          <span className="text-xs text-ink-tertiary">v{version}</span>
        </div>
      </div>
    </div>
  );
}

