/**
 * src/platform/update/orchestration/IUpdateBackupOrchestrator.ts
 *
 * Production contract for the pre-installation backup step of the
 * KDOS update pipeline.
 *
 * UpdatePipeline calls executeBackup() after checksum verification
 * succeeds and before handing the installer to UpdateInstaller.
 *
 * Responsibilities declared here
 *   - Receive a verified installer path and target version
 *   - Invoke IBackupManager to create a restore point
 *   - Return a structured BackupExecutionResult
 *   - Signal abort on failure so UpdatePipeline never proceeds
 *     to installation without a valid restore point
 *
 * Explicitly out of scope
 *   - Downloading files              (IUpdateDownloader)
 *   - Verifying checksums            (IChecksumVerifier)
 *   - Installing updates             (UpdateInstaller)
 *   - Performing rollback            (RollbackManager)
 *   - Restarting KDOS               (RestartManager)
 *   - GitHub API communication       (IGitHubReleaseProvider)
 */

import type { BackupExecutionResult } from './BackupExecutionResult';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface BackupOrchestratorOptions {
  /**
   * Absolute path to the verified installer file on disk.
   * Produced by IUpdateDownloader and validated by IChecksumVerifier.
   */
  readonly installerPath: string;

  /**
   * The version string being updated to.
   * Sourced from UpdateManifest.version.toString().
   * Used to label the restore point for human identification.
   */
  readonly targetVersion: string;

  /**
   * Absolute paths that must be included in the restore point.
   * UpdatePipeline is responsible for resolving these (e.g. app data
   * directories, database files) before invoking the orchestrator.
   */
  readonly pathsToBackup: readonly string[];

  /**
   * When true, a backup failure causes executeBackup() to return a failed
   * BackupExecutionResult rather than throw. The pipeline must still abort
   * installation — this flag only controls the error surface.
   *
   * Defaults to true. Set to false only when the caller handles exceptions.
   */
  readonly returnErrorOnFailure?: boolean;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IUpdateBackupOrchestrator {
  /**
   * Creates a pre-installation restore point via IBackupManager.
   *
   * On success  → returns BackupExecutionResult with succeeded: true and
   *               a populated restorePoint. UpdatePipeline may proceed to
   *               UpdateInstaller.
   *
   * On failure  → returns BackupExecutionResult with succeeded: false and
   *               a populated failure descriptor. UpdatePipeline must abort
   *               installation and surface the failure to the user.
   *
   * Never proceeds to installation itself.
   * Never performs rollback.
   * Never restarts KDOS.
   *
   * @param options - Installer path, target version, and paths to back up.
   * @returns       A structured BackupExecutionResult.
   */
  executeBackup(options: BackupOrchestratorOptions): Promise<BackupExecutionResult>;
}