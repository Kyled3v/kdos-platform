import type { ReactElement } from "react";
import { UserCircle2 } from "lucide-react";
import { WindowControls } from "@/shell/components/WindowControls";

const APP_VERSION = "0.0.1-development";

export function Topbar(): ReactElement {
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#2D333B] bg-[#0D1117] px-5">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-semibold text-white">KDOS</span>
        <span className="rounded-full border border-[#2D333B] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#8B949E]">
          Development Build
        </span>
        <span className="text-[11px] text-[#6E7681]">v{APP_VERSION}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Profile"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[#8B949E] transition-colors duration-150 hover:bg-[#161B22] hover:text-white"
        >
          <UserCircle2 size={20} strokeWidth={1.5} />
        </button>
        <WindowControls />
      </div>
    </header>
  );
}

