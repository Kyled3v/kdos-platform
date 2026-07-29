import { Sidebar } from "../sidebar/Sidebar";
import { Workspace } from "../workspace/Workspace";
import { StatusBar } from "../statusbar/StatusBar";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { CommandPalette } from "../command/CommandPalette";

export function DesktopLayout(): JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-white">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        <Workspace />
        <StatusBar />
      </main>

      <NotificationCenter />

      <CommandPalette />
    </div>
  );
}