export function StatusBar(): JSX.Element {
  return (
    <footer className="flex h-10 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-5 text-xs text-zinc-500">
      <div className="flex items-center gap-6">
        <span>KDOS 2.0</span>
        <span>System Ready</span>
      </div>

      <div className="flex items-center gap-6">
        <span>CPU --%</span>
        <span>RAM --%</span>
        <span>Workers 0</span>
        <span>Secure</span>
      </div>
    </footer>
  );
}