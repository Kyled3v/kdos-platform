/**
 * Domain types for the KDOS application shell state. Deliberately
 * minimal — this is the operating system shell only, with no AI,
 * workflow, employee, memory, or orchestration concepts.
 */

export type AppTheme = "dark" | "light";

export interface InstalledModule {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
}

export interface Workspace {
  readonly id: string;
  readonly name: string;
}

export type UpdateStatus = "up-to-date" | "checking" | "available" | "downloading" | "error";

