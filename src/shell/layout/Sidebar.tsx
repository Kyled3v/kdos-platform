"use client";

import { useState, type ReactElement } from "react";
import {
  Home,
  LayoutGrid,
  Boxes,
  RefreshCw,
  Settings,
  HardDrive,
  Tag,
  type LucideIcon,
} from "lucide-react";
import Logo from "@/shell/components/Logo";
import { NavigationItem } from "@/shell/components/NavigationItem";

interface SidebarNavItem {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const NAV_ITEMS: readonly SidebarNavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "workspace", label: "Workspace", icon: LayoutGrid },
  { id: "modules", label: "Modules", icon: Boxes },
  { id: "updates", label: "Updates", icon: RefreshCw },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "version", label: "Version", icon: Tag },
];

export function Sidebar(): ReactElement {
  const [activeItemId, setActiveItemId] = useState<string>(NAV_ITEMS[0].id);

  return (
    <aside className="flex h-full w-[240px] flex-shrink-0 flex-col border-r border-[#2D333B] bg-[#111827]">
      <div className="flex h-14 items-center px-5">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavigationItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={item.id === activeItemId}
            onClick={() => setActiveItemId(item.id)}
          />
        ))}
      </nav>
    </aside>
  );
}

