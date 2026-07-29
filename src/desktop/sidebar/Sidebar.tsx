export function Sidebar(): JSX.Element {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-xl font-bold tracking-wide text-white">
          KDOS
        </h1>

        <p className="mt-1 text-xs text-zinc-500">
          KyleDev Operating System
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        <button className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-left transition hover:bg-zinc-800">
          Dashboard
        </button>

        <button className="w-full rounded-lg px-4 py-3 text-left transition hover:bg-zinc-900">
          Intelligence
        </button>

        <button className="w-full rounded-lg px-4 py-3 text-left transition hover:bg-zinc-900">
          Workforce
        </button>

        <button className="w-full rounded-lg px-4 py-3 text-left transition hover:bg-zinc-900">
          Clients
        </button>

        <button className="w-full rounded-lg px-4 py-3 text-left transition hover:bg-zinc-900">
          Automation
        </button>

        <button className="w-full rounded-lg px-4 py-3 text-left transition hover:bg-zinc-900">
          Settings
        </button>
      </nav>
    </aside>
  );
}