/**
 * Domain types for the KDOS Workspace — the central area of the
 * application shell every future workspace page renders into.
 */

export interface WorkspaceSection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly sections: readonly WorkspaceSection[];
}

export interface WorkspaceState {
  readonly workspace: Workspace | null;
  readonly isLoading: boolean;
}

