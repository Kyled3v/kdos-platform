import type { ReactNode } from "react";

interface AuthLayoutProps {
  readonly children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    <main
      className="flex min-h-screen w-full items-center justify-center bg-[#111113] px-4"
      role="main"
    >
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight text-white">KDOS</span>
        </div>
        {children}
      </div>
    </main>
  );
}