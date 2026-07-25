/**
 * Strongly typed application settings for KDOS.
 */
export interface Settings {
  readonly language: string;
  readonly theme: "dark" | "light";
  readonly autoUpdate: boolean;
  readonly workspaceLocation: string;
  readonly notificationsEnabled: boolean;
}
