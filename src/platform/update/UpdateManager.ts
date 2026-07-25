/**
 * UpdateManager.ts
 *
 * Location: src/platform/update/UpdateManager.ts
 *
 * UpdateManager coordinates the complete update lifecycle. It does
 * not perform installation, verification, backup, or rollback work
 * itself - it coordinates the services that do: Manifest,
 * PackageBuilder, PackageInstaller, PackageVerifier, RollbackManager,
 * UpdateHistory, and VersionManager. None of those services are
 * implemented or referenced here beyond Manifest's own Manifest
 * type, since UpdateManager's coordination methods are expressed in
 * terms of what an update manifest describes.
 *
 * This file defines the coordination contract only - no class, no
 * implementation, no default values.
 */

import type { Manifest } from './Manifest'

/**
 * The lifecycle stage an update is currently in.
 */
export type UpdateStatus =
  | 'Idle'
  | 'Checking'
  | 'Verifying'
  | 'Installing'
  | 'Restarting'
  | 'Completed'
  | 'Failed'
  | 'RolledBack'

/**
 * A point-in-time snapshot of how far an in-progress update has
 * gotten.
 */
export interface UpdateProgress {
  readonly currentStep: string
  readonly percentage: number
  readonly currentOperation: string
}

/**
 * The outcome of an update or rollback attempt.
 */
export interface UpdateResult {
  readonly successful: boolean
  readonly version: string
  readonly message: string
  readonly restartRequired: boolean
  readonly rollbackAvailable: boolean
}

/**
 * The complete update lifecycle coordination contract.
 *
 * An UpdateManager implementation is expected to orchestrate, in
 * order: loading and validating a manifest, comparing it against the
 * currently installed version, checking compatibility, verifying the
 * package, backing up the current installation, installing, and -
 * should installation fail or be reverted - rolling back. History is
 * read and recorded around these steps, and `cleanup` releases
 * whatever resources the cycle acquired.
 */
export interface UpdateManager {
  readonly status: UpdateStatus
  readonly progress: UpdateProgress

  /**
   * Prepares the update manager for use.
   */
  initialize(): Promise<void>

  /**
   * Loads an update manifest from the given location.
   *
   * @param manifestPath - Where to load the manifest from.
   */
  loadManifest(manifestPath: string): Promise<Manifest>

  /**
   * Validates that a loaded manifest is well-formed and internally
   * consistent.
   *
   * @param manifest - The manifest to validate.
   * @returns Whether the manifest is valid.
   */
  validateManifest(manifest: Manifest): Promise<boolean>

  /**
   * Compares a manifest's version against the currently installed
   * version.
   *
   * @param manifest - The manifest to compare against.
   * @returns A negative number if the manifest's version is lower
   *          than the installed version, a positive number if it is
   *          higher, or zero if they are equal.
   */
  compareVersion(manifest: Manifest): Promise<number>

  /**
   * Checks whether the currently installed version is compatible
   * with the manifest's stated minimum supported version and
   * compatibility constraints.
   *
   * @param manifest - The manifest to check compatibility against.
   */
  checkCompatibility(manifest: Manifest): Promise<boolean>

  /**
   * Verifies the integrity and authenticity of the update package
   * described by a manifest (checksum and signature).
   *
   * @param manifest - The manifest describing the package to verify.
   */
  verifyPackage(manifest: Manifest): Promise<boolean>

  /**
   * Backs up the current installation before an update is applied.
   *
   * @returns An identifier for the created backup, usable with
   *          `rollback`.
   */
  backupCurrentInstallation(): Promise<string>

  /**
   * Installs the update package described by a manifest.
   *
   * @param manifest - The manifest describing the update to install.
   */
  install(manifest: Manifest): Promise<UpdateResult>

  /**
   * Rolls back to a previously created backup.
   *
   * @param backupId - The identifier returned by
   *        `backupCurrentInstallation` for the backup to restore.
   */
  rollback(backupId: string): Promise<UpdateResult>

  /**
   * Restarts the application, typically after an update that
   * requires it.
   */
  restartApplication(): Promise<void>

  /**
   * Loads the recorded history of past update and rollback attempts.
   */
  loadHistory(): Promise<readonly UpdateResult[]>

  /**
   * Records a single update or rollback outcome into history.
   *
   * @param result - The outcome to record.
   */
  saveHistory(result: UpdateResult): Promise<void>

  /**
   * Releases any resources acquired during the update lifecycle
   * (temporary files, in-progress backups no longer needed, and
   * similar).
   */
  cleanup(): Promise<void>
}
