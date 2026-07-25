/**
 * src/platform/update/orchestration/UpdateBackupOrchestrator.ts
 *
 * Production implementation of IUpdateBackupOrchestrator.
 *
 * Orchestrates the pre-installation backup step by delegating to the
 * injected IBackupManager. Returns a structured BackupExecutionResult
 * in all cases — UpdatePipeline inspects succeeded before proceeding.
 *
 * Does NOT install updates.
 * Does NOT download files.
 * Does NOT verify checksums.
 * Does NOT restart KDOS.
 * Does NOT perform rollback.
 */

import { stat } from 'fs/promises';

import type { IUpdateBackupOrchestrator, BackupOrchestratorOptions } from './IUpdateBackupOrchestrator';
import type { IBackupManager }                                        from '../../backup/IBackupManager';
import { BackupManagerError }                                         from '../../backup/IBackupManager';
import type { BackupExecutionResult, BackupFailureCode }              from './BackupExecutionResult';

export class UpdateBackupOrchestrator implements IUpdateBackupOrchestrator {
  private readonly backupManager: IBackupManager;

  /**
   * @param backupManager - Injected IBackupManager implementation.
   *                        Bind to the existing BackupManager in the
   *                        composition root.
   */
  public constructor(backupManager: IBackupManager) {
    this.backupManager = backupManager;
  }

  public async executeBackup(options: BackupOrchestratorOptions): Promise<BackupExecutionResult> {
    const returnErrorOnFailure = options.returnErrorOnFailure ?? true;
    const targetVersion        = options.targetVersion.trim();

    // ------------------------------------------------------------------
    // Input validation — abort before touching BackupManager
    // ------------------------------------------------------------------

    const inputError = await this.validateInput(options);
    if (inputError !== null) {
      return this.failureResult(targetVersion, 'invalid_installer_path', inputError, undefined, 'invalid_input');
    }

    // ------------------------------------------------------------------
    // Invoke BackupManager
    // ------------------------------------------------------------------

    const label = this.buildLabel(targetVersion);

    try {
      const restorePoint = await this.backupManager.createRestorePoint({
        label,
        includePaths: options.pathsToBackup,
        tag:          'pre-update',
      });

      return {
        succeeded:    true,
        status:       'success',
        restorePoint,
        targetVersion,
        completedAt:  new Date().toISOString(),
      };
    } catch (error) {
      if (!returnErrorOnFailure) throw error;

      const { code, message } = this.classifyBackupError(error);

      return this.failureResult(targetVersion, code, message, error, 'backup_failed');
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validates that the installer path exists and is a regular file.
   * Returns a human-readable error message, or null when valid.
   */
  private async validateInput(options: BackupOrchestratorOptions): Promise<string | null> {
    const { installerPath, targetVersion, pathsToBackup } = options;

    if (installerPath.trim().length === 0) {
      return 'installerPath must not be empty.';
    }

    if (targetVersion.trim().length === 0) {
      return 'targetVersion must not be empty.';
    }

    if (pathsToBackup.length === 0) {
      return 'pathsToBackup must contain at least one path.';
    }

    try {
      const stats = await stat(installerPath);
      if (!stats.isFile()) {
        return `installerPath "${installerPath}" exists but is not a regular file.`;
      }
    } catch {
      return `installerPath "${installerPath}" does not exist on disk.`;
    }

    return null;
  }

  /**
   * Maps a BackupManagerError or unknown error to a structured failure code
   * and human-readable message.
   */
  private classifyBackupError(error: unknown): { code: BackupFailureCode; message: string } {
    if (error instanceof BackupManagerError) {
      const codeMap: Record<BackupManagerError['reason'], BackupFailureCode> = {
        insufficient_disk_space:    'insufficient_disk_space',
        source_path_not_found:      'source_path_not_found',
        storage_path_not_writable:  'storage_path_not_writable',
        io_error:                   'io_error',
        unknown:                    'unknown',
      };

      return {
        code:    codeMap[error.reason] ?? 'unknown',
        message: error.message,
      };
    }

    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred during backup.';

    return { code: 'unknown', message };
  }

  private buildLabel(targetVersion: string): string {
    const timestamp = new Date().toISOString();
    return `Pre-update ${targetVersion} — ${timestamp}`;
  }

  private failureResult(
    targetVersion: string,
    code:          BackupFailureCode,
    message:       string,
    cause:         unknown,
    status:        'backup_failed' | 'invalid_input',
  ): BackupExecutionResult {
    return {
      succeeded:    false,
      status,
      restorePoint: null,
      targetVersion,
      completedAt:  new Date().toISOString(),
      failure: {
        reason:  code,
        message,
        cause,
      },
    };
  }
}