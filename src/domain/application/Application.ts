/**
 * Represents the installed KDOS application on the current machine.
 */
export interface Application {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly build: string;
  readonly channel: "stable" | "beta";
  readonly installPath: string;
  readonly firstInstalled: Date;
  readonly lastUpdated: Date;
}

