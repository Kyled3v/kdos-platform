export function Dashboard(): JSX.Element {
  return (
    <main className="flex h-full flex-col gap-6 p-8">
      <header>
        <h1 className="text-3xl font-bold text-white">
          Dashboard
        </h1>

        <p className="mt-2 text-zinc-500">
          Welcome back to KDOS.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm text-zinc-500">
            AI Workers
          </h2>

          <p className="mt-3 text-3xl font-bold text-white">
            0
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm text-zinc-500">
            Active Projects
          </h2>

          <p className="mt-3 text-3xl font-bold text-white">
            0
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm text-zinc-500">
            Automations
          </h2>

          <p className="mt-3 text-3xl font-bold text-white">
            0
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm text-zinc-500">
            System Health
          </h2>

          <p className="mt-3 text-3xl font-bold text-green-400">
            100%
          </p>
        </div>
      </section>
    </main>
  );
}