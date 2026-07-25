/**
 * src/platform/backup/IBackupManager.ts
 *
 * Injection seam for the KDOS BackupManager.
 *
 * UpdateBackupOrchestrator depends on this interface — never on the
 * concrete BackupManager class. Your existing BackupManager adds
 * "implements IBackupManager" and satisfies this contract.
 *
 * No download logic. No installer logic. No GitHub communication.
 */

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface CreateRestorePointOptions {
  /**
   * Human-readable label stored alongside the restore point.
   * Example: "Pre-update 2.1.3 — 2025-07-25T10:00:00Z"
   */
  readonly label: string;

  /**
   * Absolute paths that must be included in this restore point.
   * The BackupManager implementation decides how to snapshot them.
   */
  readonly includePaths: readonly string[];

  /**
   * Optional caller-defined tag for filtering restore points later.
   * Example: "pre-update"
   */
  readonly tag?: string;
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export interface RestorePoint {
  /** Stable identifier assigned by BackupManager to this restore point. */
  readonly id: string;

  /** The label supplied in CreateRestorePointOptions. */
  readonly label: string;

  /**
   * Absolute path to the directory or archive where this restore point
   * is stored on disk.
   */
  readonly storagePath: string;

  /** ISO-8601 UTC timestamp of when the restore point was created. */
  readonly createdAt: string;

  /** The tag supplied in CreateRestorePointOptions, or null when absent. */
  readonly tag: string | null;

  /** Total size of the restore point in bytes. */
  readonly sizeBytes: number;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export type BackupFailureReason =
  | 'insufficient_disk_space'
  | 'source_path_not_found'
  | 'storage_path_not_writable'
  | 'io_error'
  | 'unknown';

export class BackupManagerError extends Error {
  public readonly reason: BackupFailureReason;
  public readonly cause:  unknown;

  constructor(reason: BackupFailureReason, message: string, cause?: unknown) {
    super(message);
    this.name   = 'BackupManagerError';
    this.reason = reason;
    this.cause  = cause;
  }
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IBackupManager {
  /**
   * Creates a restore point containing snapshots of the supplied paths.
   *
   * @param options - Label, paths to include, and optional tag.
   * @returns       A RestorePoint descriptor on success.
   * @throws        BackupManagerError on any failure.
   */
  createRestorePoint(options: CreateRestorePointOptions): Promise<RestorePoint>;

  /**
   * Returns all restore points currently held in storage,
   * ordered by createdAt ascending.
   *
   * @returns Array of RestorePoint descriptors, empty when none exist.
   */
  listRestorePoints(): Promise<RestorePoint[]>;

  /**
   * Permanently deletes a restore point and its on-disk storage.
   * Must be idempotent — deleting a non-existent id must not throw.
   *
   * @param id - The restore point identifier to delete.
   */
  deleteRestorePoint(id: string): Promise<void>;
}