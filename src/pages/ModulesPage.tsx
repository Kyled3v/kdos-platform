import { Boxes } from "lucide-react";
import { useAppStore } from "@/stores/AppStore";

export function ModulesPage() {
  const installedModules = useAppStore((state) => state.installedModules);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-primary">Modules</h1>
        <p className="mt-1 text-sm text-ink-secondary">Installed system modules.</p>
      </div>

      {installedModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-surface-border py-16 text-center">
          <Boxes className="h-6 w-6 text-ink-tertiary" strokeWidth={1.5} />
          <p className="text-sm text-ink-secondary">No modules installed.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {installedModules.map((module) => (
            <li
              key={module.id}
              className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-panel/60 px-4 py-3"
            >
              <span className="text-sm text-ink-primary">{module.name}</span>
              <span className="text-xs text-ink-tertiary">{module.enabled ? "Enabled" : "Disabled"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

