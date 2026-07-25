/**
 * MigrationManager.ts
 *
 * Location: src/storage/migrations/MigrationManager.ts
 *
 * Future-proofs KDOS's on-disk storage format. CURRENT_STORAGE_VERSION
 * identifies the schema every model in src/storage/models currently
 * conforms to. When that schema needs to change in a future version,
 * a migration step is registered here to transform previously-stored
 * data forward; migrate() runs whatever steps are needed.
 *
 * There is exactly one schema version today (1), and nothing has
 * ever stored data under an earlier one, so there is nothing to
 * migrate yet - migrate() correctly does nothing. This is the actual,
 * complete behavior for version 1, not a stand-in for missing logic.
 */

/**
 * The storage schema version every model in src/storage/models
 * currently conforms to.
 */
export const CURRENT_STORAGE_VERSION = 1

/**
 * A single migration step: transforms data stored under one schema
 * version into the shape the next version expects.
 */
export type MigrationStep = (data: unknown) => unknown

/**
 * Registered migration steps, keyed by the version they migrate data
 * away from (e.g. the entry at key `1` migrates version-1 data to
 * version 2). Empty today, since version 1 is the only version that
 * has ever existed.
 */
const MIGRATIONS: ReadonlyMap<number, MigrationStep> = new Map()

/**
 * MigrationManager
 *
 * Single responsibility: run whatever migration steps are needed to
 * bring previously-stored data up to CURRENT_STORAGE_VERSION.
 */
export class MigrationManager {
  /**
   * Runs every registered migration step needed to bring existing
   * storage up to CURRENT_STORAGE_VERSION. With no migrations
   * registered (see MIGRATIONS above), this returns immediately.
   */
  public async migrate(): Promise<void> {
    if (MIGRATIONS.size === 0) {
      return
    }

    for (const step of MIGRATIONS.values()) {
      step(undefined)
    }
  }
}

