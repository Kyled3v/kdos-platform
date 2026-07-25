/**
 * Represents the active workspace.
 */
export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly created: Date;
  readonly lastOpened: Date;
  readonly theme: "dark" | "light";
}

