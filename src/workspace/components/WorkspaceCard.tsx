"use client";

import type { ReactElement, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface WorkspaceCardProps {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly children?: ReactNode;
  readonly onClick?: () => void;
}

export function WorkspaceCard({
  title,
  description,
  icon: Icon,
  children,
  onClick,
}: WorkspaceCardProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-lg border border-[#2D333B] bg-[#161B22] p-5 text-left transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[#2563EB]/40 hover:bg-[#1A222C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0D1117] text-[#2563EB] transition-colors duration-150 group-hover:bg-[#2563EB] group-hover:text-white">
        <Icon size={18} strokeWidth={1.75} />
      </span>

      <div className="flex flex-col gap-1">
        <span className="text-[14px] font-medium text-white">{title}</span>
        <span className="text-[12.5px] leading-relaxed text-[#8B949E]">{description}</span>
      </div>

      {children && <div className="w-full pt-1">{children}</div>}
    </button>
  );
}

