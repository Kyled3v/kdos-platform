"use client";

import type { ReactElement } from "react";
import type { LucideIcon } from "lucide-react";

export interface NavigationItemProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly active?: boolean;
  readonly onClick?: () => void;
}

export function NavigationItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: NavigationItemProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-all duration-150 ease-out ${
        active
          ? "bg-[#161B22] text-white"
          : "text-[#8B949E] hover:translate-x-0.5 hover:bg-[#161B22] hover:text-white"
      }`}
    >
      <Icon
        size={17}
        strokeWidth={1.75}
        className={`flex-shrink-0 transition-colors duration-150 ${
          active ? "text-[#2563EB]" : "text-[#6E7681] group-hover:text-[#2563EB]"
        }`}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

