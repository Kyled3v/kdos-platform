/**
 * RollbackManager
 *
 * Restores a KDOS installation from a backup created by BackupManager.
 * Responsibilities:
 *
 *   - Read the restore point and backup manifest from storage
 *   - Restore each file to its original location
 *   - Verify file integrity after restoration using checksums
 *   - Remove failed-update artifacts
 *   - Return a detailed rollback report
 *
 * RollbackManager performs no filesystem access directly; all I/O is
 * delegated to RollbackStorageGateway.
 */

import { RestorePoint, deserializeRestorePoint } from "./RestorePoint";
import { BackupManifest, BackupFileRecord, deserializeBackupManifest } from "./BackupManifest";

export interface RollbackStorageGateway {
  readTextFile(absoluteFilePath: string): Promise<string>;
  copyFile(absoluteSourcePath: string, absoluteDestinationPath: string): Promise<void>;
  computeSha256(absoluteFilePath: string): Promise<string>;
  deleteDirectory(absoluteDirectoryPath: string): Promise<void>;
  deleteFile(absoluteFilePath: string): Promise<void>;
  fileExists(absoluteFilePath: string): Promise<boolean>;
  joinPath(...segments: ReadonlyArray<string>): string;
}

export interface RollbackOptions {
  readonly failedUpdateArtifactPaths: ReadonlyArray<string>;
}

export interface RestoredFileRecord {
  readonly relativePath: string;
  readonly originalAbsolutePath: string;
  readonly checksumVerified: boolean;
  readonly message: string;
}

export type RollbackStatus = "Succeeded" | "PartiallySucceeded" | "Failed";

export interface RollbackReport {
  readonly status: RollbackStatus;
  readonly restorePoint: RestorePoint;
  readonly restoredFiles: ReadonlyArray<RestoredFileRecord>;
  readonly failedFiles: ReadonlyArray<RestoredFileRecord>;
  readonly removedArtifacts: ReadonlyArray<string>;
  readonly rolledBackAt: Date;
  readonly message: string;
}

const RESTORE_POINT_FILE_NAME = "restore-point.json";
const BACKUP_MANIFEST_FILE_NAME = "backup-manifest.json";

export class RollbackManager {
  private readonly storage: RollbackStorageGateway;

  public constructor(storage: RollbackStorageGateway) {
    this.storage = storage;
  }

  public async rollback(
    backupPath: string,
    options: RollbackOptions
  ): Promise<RollbackReport> {
    const rolledBackAt = new Date();

    const restorePoint = await this.readRestorePoint(backupPath);
    const manifest = await this.readManifest(backupPath);

    const restoredFiles: RestoredFileRecord[] = [];
    const failedFiles: RestoredFileRecord[] = [];

    for (const fileRecord of manifest.backedUpFiles) {
      const result = await this.restoreFile(fileRecord);

      if (result.checksumVerified) {
        restoredFiles.push(result);
      } else {
        failedFiles.push(result);
      }
    }

    const removedArtifacts = await this.removeArtifacts(options.failedUpdateArtifactPaths);

    const status = this.resolveStatus(restoredFiles, failedFiles, manifest.backedUpFiles.length);

    return {
      status,
      restorePoint,
      restoredFiles,
      failedFiles,
      removedArtifacts,
      rolledBackAt,
      message: this.buildMessage(status, restoredFiles.length, failedFiles.length),
    };
  }

  private async readRestorePoint(backupPath: string): Promise<RestorePoint> {
    const filePath = this.storage.joinPath(backupPath, RESTORE_POINT_FILE_NAME);
    const json = await this.storage.readTextFile(filePath);

    return deserializeRestorePoint(json);
  }

  private async readManifest(backupPath: string): Promise<BackupManifest> {
    const filePath = this.storage.joinPath(backupPath, BACKUP_MANIFEST_FILE_NAME);
    const json = await this.storage.readTextFile(filePath);

    return deserializeBackupManifest(json);
  }

  private async restoreFile(fileRecord: BackupFileRecord): Promise<RestoredFileRecord> {
    try {
      await this.storage.copyFile(
        fileRecord.backupAbsolutePath,
        fileRecord.originalAbsolutePath
      );

      const restoredChecksum = await this.storage.computeSha256(fileRecord.originalAbsolutePath);
      const checksumVerified =
        restoredChecksum.toLowerCase().trim() === fileRecord.checksum.toLowerCase().trim();

      return {
        relativePath: fileRecord.relativePath,
        originalAbsolutePath: fileRecord.originalAbsolutePath,
        checksumVerified,
        message: checksumVerified
          ? "File restored and checksum verified."
          : "File restored but checksum did not match the backup record.",
      };
    } catch (error) {
      return {
        relativePath: fileRecord.relativePath,
        originalAbsolutePath: fileRecord.originalAbsolutePath,
        checksumVerified: false,
        message:
          error instanceof Error
            ? `Restoration failed: ${error.message}`
            : "Restoration failed with an unknown error.",
      };
    }
  }

  private async removeArtifacts(artifactPaths: ReadonlyArray<string>): Promise<ReadonlyArray<string>> {
    const removed: string[] = [];

    for (const artifactPath of artifactPaths) {
      const exists = await this.storage.fileExists(artifactPath);

      if (!exists) {
        continue;
      }

      try {
        await this.storage.deleteFile(artifactPath);
        removed.push(artifactPath);
      } catch {
        // Non-critical: artifact removal failures do not abort the rollback.
      }
    }

    return removed;
  }

  private resolveStatus(
    restoredFiles: ReadonlyArray<RestoredFileRecord>,
    failedFiles: ReadonlyArray<RestoredFileRecord>,
    totalFiles: number
  ): RollbackStatus {
    if (failedFiles.length === 0 && restoredFiles.length === totalFiles) {
      return "Succeeded";
    }

    if (restoredFiles.length > 0) {
      return "PartiallySucceeded";
    }

    return "Failed";
  }

  private buildMessage(
    status: RollbackStatus,
    restoredCount: number,
    failedCount: number
  ): string {
    switch (status) {
      case "Succeeded":
        return `Rollback succeeded. ${restoredCount} file${restoredCount === 1 ? "" : "s"} restored.`;
      case "PartiallySucceeded":
        return `Rollback partially succeeded. ${restoredCount} file${restoredCount === 1 ? "" : "s"} restored, ${failedCount} failed.`;
      case "Failed":
        return `Rollback failed. ${failedCount} file${failedCount === 1 ? "" : "s"} could not be restored.`;
    }
  }
}