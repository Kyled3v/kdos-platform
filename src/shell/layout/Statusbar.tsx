import type { ReactElement } from "react";
import { Circle } from "lucide-react";

export function Statusbar(): ReactElement {
  return (
    <footer className="flex h-7 flex-shrink-0 items-center justify-between border-t border-[#2D333B] bg-[#111827] px-4 text-[11px] text-[#6E7681]">
      <div className="flex items-center gap-4">
        <span>Development Build</span>
        <span className="flex items-center gap-1.5">
          <Circle size={6} className="fill-[#6E7681] text-[#6E7681]" />
          Offline
        </span>
        <span>Local Mode</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Circle size={6} className="fill-[#2563EB] text-[#2563EB]" />
        System Ready
      </div>
    </footer>
  );
}

