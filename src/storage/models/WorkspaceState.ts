/**
 * WorkspaceState.ts
 *
 * Location: src/storage/models/WorkspaceState.ts
 *
 * The persisted state of a user's workspace: what they were recently
 * working on, what they have pinned, and which modules were open.
 * Types only.
 */

/**
 * A single project the user has recently opened.
 */
export interface RecentProjectEntry {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly lastOpenedAt: string
}

/**
 * A single item the user has explicitly favorited/pinned.
 */
export interface FavoriteEntry {
  readonly id: string
  readonly label: string
  readonly targetPath: string
}

export interface WorkspaceState {
  readonly recentProjects: readonly RecentProjectEntry[]
  readonly favorites: readonly FavoriteEntry[]
  readonly openedModules: readonly string[]
  readonly lastWorkspace: string
}

