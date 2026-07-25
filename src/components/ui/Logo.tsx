import { cn } from "@/lib/cn";

/**
 * Resolves the brand mark from src/assets/logo.png at build time using a
 * glob import, so the app compiles and runs identically whether or not
 * the file has been supplied yet. Dropping in assets/logo.png later
 * requires no code changes.
 */
const logoModules = import.meta.glob<{ default: string }>("../../assets/logo.png", {
  eager: true,
});

const logoSrc = Object.values(logoModules)[0]?.default ?? null;

interface LogoProps {
  readonly className?: string;
}

export function Logo({ className }: LogoProps) {
  if (logoSrc) {
    return <img src={logoSrc} alt="KDOS" className={cn("h-6 w-auto", className)} />;
  }

  return (
    <span className={cn("font-sans text-lg font-semibold tracking-tight text-ink-primary", className)}>
      KDOS
    </span>
  );
}

