/**
 * WorkspaceRepository.ts
 *
 * Location: src/storage/repositories/WorkspaceRepository.ts
 *
 * Loads and saves WorkspaceState through StorageEngine. This is the
 * only file in the storage layer that knows the on-disk file name
 * for workspace state, or what a sensible default WorkspaceState
 * looks like when none has been persisted yet.
 */

import { StorageEngine } from '../engine/StorageEngine'
import type { WorkspaceState } from '../models/WorkspaceState'

const WORKSPACE_STATE_FILE = 'workspace-state.json'

const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  recentProjects: [],
  favorites: [],
  openedModules: [],
  lastWorkspace: 'home',
}

/**
 * WorkspaceRepository
 *
 * Single responsibility: load and save WorkspaceState.
 *
 * This class:
 *   - Delegates all actual file I/O to the injected StorageEngine -
 *     it never touches the filesystem directly.
 *   - Returns DEFAULT_WORKSPACE_STATE from load() when no state has
 *     been persisted yet (first run) or the persisted file was found
 *     corrupted, rather than returning null or throwing.
 */
export class WorkspaceRepository {
  private readonly storageEngine: StorageEngine

  public constructor(storageEngine: StorageEngine) {
    this.storageEngine = storageEngine
  }

  /**
   * Loads the persisted WorkspaceState, or DEFAULT_WORKSPACE_STATE if
   * none exists yet.
   */
  public async load(): Promise<WorkspaceState> {
    const state = await this.storageEngine.read<WorkspaceState>(WORKSPACE_STATE_FILE)
    return state ?? DEFAULT_WORKSPACE_STATE
  }

  /**
   * Persists the given WorkspaceState, replacing whatever was
   * previously stored.
   */
  public async save(state: WorkspaceState): Promise<void> {
    await this.storageEngine.write<WorkspaceState>(WORKSPACE_STATE_FILE, state)
  }
}

