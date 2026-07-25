import type { ReactElement } from "react";
import { Minus, Square, X } from "lucide-react";

export function WindowControls(): ReactElement {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Minimize"
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#8B949E] transition-colors duration-150 hover:bg-[#161B22] hover:text-white"
      >
        <Minus size={14} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="Maximize"
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#8B949E] transition-colors duration-150 hover:bg-[#161B22] hover:text-white"
      >
        <Square size={12} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="Close"
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#8B949E] transition-colors duration-150 hover:bg-[#DA3633] hover:text-white"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

