import { CircleUserRound } from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/shared/constants/app";

export function Topbar() {
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#242832] bg-[#0B0C0E] px-5">
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] font-semibold text-[#F2F3F5]">{APP_NAME}</span>
        <span className="text-[11px] text-[#6B7280]">v{APP_VERSION}</span>
      </div>

      <button
        type="button"
        aria-label="User account"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[#9CA3AF] transition-colors hover:bg-[#171A20] hover:text-[#F2F3F5]"
      >
        <CircleUserRound size={20} strokeWidth={1.5} />
      </button>
    </header>
  );
}

export default Topbar;

