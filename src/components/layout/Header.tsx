import { ChevronDown } from "lucide-react";
import { useAppStore } from "@/stores/AppStore";

export function Header() {
  const currentWorkspace = useAppStore((state) => state.currentWorkspace);

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-surface-border bg-surface-base/80 px-6 backdrop-blur-glass">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-ink-secondary transition-colors hover:bg-surface-panel hover:text-ink-primary"
      >
        {currentWorkspace?.name ?? "No workspace"}
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </header>
  );
}

