/**
 * src/platform/update/orchestration/BackupExecutionResult.ts
 *
 * Structured result types for the pre-installation backup step.
 *
 * No I/O. No downloads. No installer logic. Pure data.
 */

import type { RestorePoint } from '../../backup/IBackupManager';

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type BackupExecutionStatus =
  /** Restore point was created successfully. Installation may proceed. */
  | 'success'
  /** BackupManager failed. Installation must be aborted. */
  | 'backup_failed'
  /** Input validation failed before BackupManager was invoked. */
  | 'invalid_input';

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export interface BackupExecutionResult {
  /** Whether the backup completed successfully and installation may proceed. */
  readonly succeeded: boolean;

  /** Discriminated status describing the outcome. */
  readonly status: BackupExecutionStatus;

  /**
   * The created restore point descriptor.
   * Populated only when status is 'success'.
   */
  readonly restorePoint: RestorePoint | null;

  /**
   * The version string being updated to, carried through for pipeline logging.
   * Example: "2.1.3"
   */
  readonly targetVersion: string;

  /**
   * ISO-8601 UTC timestamp of when the backup step completed (success or failure).
   */
  readonly completedAt: string;

  /**
   * Structured failure detail.
   * Undefined when succeeded is true.
   */
  readonly failure?: BackupExecutionFailure;
}

export interface BackupExecutionFailure {
  /** Machine-readable reason for the failure. */
  readonly reason: BackupFailureCode;

  /** Human-readable description suitable for logging and UI display. */
  readonly message: string;

  /** The underlying error from BackupManager, when applicable. */
  readonly cause: unknown;
}

export type BackupFailureCode =
  | 'backup_manager_error'
  | 'insufficient_disk_space'
  | 'source_path_not_found'
  | 'storage_path_not_writable'
  | 'io_error'
  | 'invalid_installer_path'
  | 'unknown';