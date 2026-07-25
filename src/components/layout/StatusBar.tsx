import { Circle } from "lucide-react";
import { useAppStore } from "@/stores/AppStore";
import { cn } from "@/lib/cn";

const UPDATE_STATUS_LABEL: Record<string, string> = {
  "up-to-date": "Up to date",
  checking: "Checking for updates",
  available: "Update available",
  downloading: "Downloading update",
  error: "Update failed",
};

export function StatusBar() {
  const version = useAppStore((state) => state.version);
  const updateStatus = useAppStore((state) => state.updateStatus);

  const isHealthy = updateStatus === "up-to-date";

  return (
    <footer className="flex h-7 flex-shrink-0 items-center justify-between border-t border-surface-border bg-surface-raised px-4 text-xs text-ink-tertiary">
      <div className="flex items-center gap-1.5">
        <Circle
          className={cn("h-2 w-2", isHealthy ? "fill-accent text-accent" : "fill-ink-tertiary text-ink-tertiary")}
        />
        <span>{UPDATE_STATUS_LABEL[updateStatus]}</span>
      </div>
      <span>KDOS v{version}</span>
    </footer>
  );
}

