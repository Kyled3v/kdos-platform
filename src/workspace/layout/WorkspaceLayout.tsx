import type { ReactElement, ReactNode } from "react";

export interface WorkspaceLayoutProps {
  readonly children: ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps): ReactElement {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 flex-shrink-0 items-center border-b border-[#2D333B] bg-[#0D1117] px-8">
        <span className="text-[12px] font-medium uppercase tracking-wide text-[#6E7681]">
          Workspace
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
    </div>
  );
}

