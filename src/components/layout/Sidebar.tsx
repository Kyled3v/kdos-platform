"use client";

import { useState } from "react";
import {
  Home,
  LayoutGrid,
  FolderKanban,
  Users,
  Boxes,
  RefreshCw,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/branding/Logo";

interface SidebarMenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const MENU_ITEMS: readonly SidebarMenuItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "workspace", label: "Workspace", icon: LayoutGrid },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "employees", label: "Employees", icon: Users },
  { id: "modules", label: "Modules", icon: Boxes },
  { id: "updates", label: "Updates", icon: RefreshCw },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string>(MENU_ITEMS[0].id);

  return (
    <aside
      className={`flex h-full flex-shrink-0 flex-col border-r border-[#242832] bg-[#111318] transition-[width] duration-200 ${
        isCollapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      <div className="flex h-14 items-center px-4">
        {!isCollapsed && <Logo compact />}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeItemId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveItemId(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-[#171A20] text-[#F2F3F5]"
                  : "text-[#9CA3AF] hover:bg-[#171A20] hover:text-[#F2F3F5]"
              }`}
            >
              <Icon size={17} strokeWidth={1.75} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#1B1E25] p-2">
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center rounded-md py-2 text-[#6B7280] transition-colors hover:bg-[#171A20] hover:text-[#F2F3F5]"
        >
          {isCollapsed ? (
            <ChevronsRight size={16} strokeWidth={1.75} />
          ) : (
            <ChevronsLeft size={16} strokeWidth={1.75} />
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

