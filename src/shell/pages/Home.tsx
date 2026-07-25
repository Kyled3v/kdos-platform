import type { ReactElement } from "react";
import { Cpu, HardDrive, RefreshCw } from "lucide-react";

interface StatusCard {
  readonly id: string;
  readonly icon: typeof Cpu;
  readonly title: string;
  readonly status: string;
}

const STATUS_CARDS: readonly StatusCard[] = [
  { id: "runtime", icon: Cpu, title: "Core Runtime", status: "Installed" },
  { id: "storage", icon: HardDrive, title: "Local Storage", status: "Ready" },
  { id: "updates", icon: RefreshCw, title: "Update Engine", status: "Ready" },
];

export function Home(): ReactElement {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-8 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome to KDOS</h1>
        <p className="text-[15px] text-[#8B949E]">Your operating system is ready.</p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {STATUS_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="flex flex-col items-center gap-3 rounded-lg border border-[#2D333B] bg-[#161B22] px-5 py-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0D1117] text-[#2563EB]">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-white">{card.title}</span>
                <span className="text-[12px] text-[#8B949E]">{card.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="rounded-md bg-[#2563EB] px-6 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1D4ED8]"
      >
        Open Workspace
      </button>
    </div>
  );
}

