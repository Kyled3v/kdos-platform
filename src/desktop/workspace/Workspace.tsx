import { Dashboard } from "@/dashboard/Dashboard";

export function Workspace(): JSX.Element {
  return (
    <main className="flex-1 overflow-auto bg-[#0f1115]">
      <Dashboard />
    </main>
  );
}