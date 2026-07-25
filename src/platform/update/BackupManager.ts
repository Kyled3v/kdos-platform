/**
 * BackupManager
 *
 * Creates a versioned backup of the current KDOS installation under
 * storage/backups/ before any update is applied. Responsibilities:
 *
 *   - Create backup folder
 *   - Copy modified files into the backup
 *   - Generate a restore point
 *   - Write a backup manifest
 *   - Compress the backup when the gateway supports it
 *
 * BackupManager performs no filesystem access directly; all I/O is
 * delegated to BackupStorageGateway.
 */

import {
  RestorePoint,
  generateRestorePointId,
  serializeRestorePoint,
} from "./RestorePoint";

import {
  BackupManifest,
  BackupFileRecord,
  buildBackupManifest,
  serializeBackupManifest,
} from "./BackupManifest";

export interface BackupStorageGateway {
  createDirectory(absoluteDirectoryPath: string): Promise<void>;
  listFilesRecursive(absoluteRootPath: string): Promise<ReadonlyArray<string>>;
  copyFile(absoluteSourcePath: string, absoluteDestinationPath: string): Promise<void>;
  getFileSize(absoluteFilePath: string): Promise<number>;
  computeSha256(absoluteFilePath: string): Promise<string>;
  writeTextFile(absoluteFilePath: string, contents: string): Promise<void>;
  compressDirectory(absoluteDirectoryPath: string, absoluteArchivePath: string): Promise<string>;
  supportsCompression(): boolean;
  joinPath(...segments: ReadonlyArray<string>): string;
}

export interface BackupManagerOptions {
  readonly backupsRootPath: string;
  readonly applicationInstallPath: string;
  readonly currentVersion: string;
}

export interface BackupResult {
  readonly successful: boolean;
  readonly restorePoint: RestorePoint;
  readonly manifest: BackupManifest;
  readonly archivePath: string | undefined;
  readonly message: string;
}

const RESTORE_POINT_FILE_NAME = "restore-point.json";
const BACKUP_MANIFEST_FILE_NAME = "backup-manifest.json";

export class BackupManager {
  private readonly storage: BackupStorageGateway;
  private readonly options: BackupManagerOptions;

  public constructor(storage: BackupStorageGateway, options: BackupManagerOptions) {
    this.storage = storage;
    this.options = options;
  }

  public async createBackup(): Promise<BackupResult> {
    const restorePoint = await this.createRestorePoint();
    const backupDirectory = restorePoint.backupPath;

    await this.storage.createDirectory(backupDirectory);

    const manifest = await this.copyFiles(restorePoint, backupDirectory);

    await this.writeRestorePoint(restorePoint, backupDirectory);
    await this.writeManifest(manifest, backupDirectory);

    let archivePath: string | undefined;

    if (this.storage.supportsCompression()) {
      const archiveDestination = this.storage.joinPath(
        this.options.backupsRootPath,
        `${restorePoint.id}.tar.gz`
      );

      archivePath = await this.storage.compressDirectory(backupDirectory, archiveDestination);
    }

    return {
      successful: true,
      restorePoint,
      manifest,
      archivePath,
      message: `Backup created successfully for version ${this.options.currentVersion}.`,
    };
  }

  private async createRestorePoint(): Promise<RestorePoint> {
    const id = generateRestorePointId();
    const backupPath = this.storage.joinPath(this.options.backupsRootPath, id);

    return {
      id,
      version: this.options.currentVersion,
      timestamp: new Date(),
      backupPath,
    };
  }

  private async copyFiles(
    restorePoint: RestorePoint,
    backupDirectory: string
  ): Promise<BackupManifest> {
    const relativePaths = await this.storage.listFilesRecursive(
      this.options.applicationInstallPath
    );

    const backedUpFiles: BackupFileRecord[] = [];

    for (const relativePath of relativePaths) {
      const originalAbsolutePath = this.storage.joinPath(
        this.options.applicationInstallPath,
        relativePath
      );

      const backupAbsolutePath = this.storage.joinPath(backupDirectory, relativePath);

      await this.storage.copyFile(originalAbsolutePath, backupAbsolutePath);

      const [checksum, sizeInBytes] = await Promise.all([
        this.storage.computeSha256(backupAbsolutePath),
        this.storage.getFileSize(backupAbsolutePath),
      ]);

      backedUpFiles.push({
        relativePath,
        originalAbsolutePath,
        backupAbsolutePath,
        checksum,
        sizeInBytes,
      });
    }

    return buildBackupManifest(restorePoint.id, restorePoint.version, backedUpFiles);
  }

  private async writeRestorePoint(
    restorePoint: RestorePoint,
    backupDirectory: string
  ): Promise<void> {
    const filePath = this.storage.joinPath(backupDirectory, RESTORE_POINT_FILE_NAME);
    await this.storage.writeTextFile(filePath, serializeRestorePoint(restorePoint));
  }

  private async writeManifest(manifest: BackupManifest, backupDirectory: string): Promise<void> {
    const filePath = this.storage.joinPath(backupDirectory, BACKUP_MANIFEST_FILE_NAME);
    await this.storage.writeTextFile(filePath, serializeBackupManifest(manifest));
  }
}