/**
 * ApplicationRepository.ts
 *
 * Location: src/storage/repositories/ApplicationRepository.ts
 *
 * Loads and saves ApplicationState through StorageEngine. This is
 * the only file in the storage layer that knows the on-disk file
 * name for application state, or what a sensible default
 * ApplicationState looks like when none has been persisted yet.
 */

import { StorageEngine } from '../engine/StorageEngine'
import type { ApplicationState } from '../models/ApplicationState'

const APPLICATION_STATE_FILE = 'application-state.json'

const DEFAULT_APPLICATION_STATE: ApplicationState = {
  version: '2.0.0',
  channel: 'dev',
  theme: 'dark',
  language: 'en',
  windowWidth: 1400,
  windowHeight: 900,
  lastOpened: new Date(0).toISOString(),
}

/**
 * ApplicationRepository
 *
 * Single responsibility: load and save ApplicationState.
 *
 * This class:
 *   - Delegates all actual file I/O to the injected StorageEngine -
 *     it never touches the filesystem directly.
 *   - Returns DEFAULT_APPLICATION_STATE from load() when no state
 *     has been persisted yet (first run) or the persisted file was
 *     found corrupted, rather than returning null or throwing.
 */
export class ApplicationRepository {
  private readonly storageEngine: StorageEngine

  public constructor(storageEngine: StorageEngine) {
    this.storageEngine = storageEngine
  }

  /**
   * Loads the persisted ApplicationState, or DEFAULT_APPLICATION_STATE
   * if none exists yet.
   */
  public async load(): Promise<ApplicationState> {
    const state = await this.storageEngine.read<ApplicationState>(APPLICATION_STATE_FILE)
    return state ?? DEFAULT_APPLICATION_STATE
  }

  /**
   * Persists the given ApplicationState, replacing whatever was
   * previously stored.
   */
  public async save(state: ApplicationState): Promise<void> {
    await this.storageEngine.write<ApplicationState>(APPLICATION_STATE_FILE, state)
  }
}

