/**
 * PackageInstaller
 *
 * Responsible for installing a VERIFIED update package.
 *
 * PackageInstaller NEVER verifies packages.
 * PackageInstaller NEVER checks versions.
 * Those responsibilities belong to other services.
 */

export type InstallationStage =
  | "Preparing"
  | "BackingUp"
  | "Extracting"
  | "ReplacingFiles"
  | "RunningMigrations"
  | "CleaningUp"
  | "Restarting"
  | "Completed"
  | "Failed";

export interface InstallationProgress {
  readonly currentStage: InstallationStage;
  readonly percentage: number;
  readonly currentFile: string | undefined;
}

export interface InstallationResult {
  readonly successful: boolean;
  readonly installedVersion: string;
  readonly restartRequired: boolean;
  readonly rollbackAvailable: boolean;
  readonly message: string;
}

export interface BackupRequest {
  readonly sourcePath: string;
  readonly backupPath: string;
  readonly requestedAt: Date;
}

export interface BackupHandle {
  readonly backupPath: string;
  readonly createdAt: Date;
}

export interface ExtractionRequest {
  readonly packagePath: string;
  readonly destinationPath: string;
  readonly requestedAt: Date;
}

export interface ExtractionHandle {
  readonly extractedPath: string;
  readonly extractedFileCount: number;
}

export interface FileReplacementRequest {
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly requestedAt: Date;
}

export interface FileReplacementHandle {
  readonly replacedFileCount: number;
  readonly completedAt: Date;
}

export interface MigrationRequest {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly requestedAt: Date;
}

export interface MigrationHandle {
  readonly appliedMigrationCount: number;
  readonly completedAt: Date;
}

export interface RestartRequest {
  readonly reason: string;
  readonly requestedAt: Date;
}

export interface InstallationGateway {
  createBackup(request: BackupRequest): Promise<BackupHandle>;
  extractPackage(request: ExtractionRequest): Promise<ExtractionHandle>;
  replaceFiles(
    request: FileReplacementRequest
  ): Promise<FileReplacementHandle>;
  runMigrations(request: MigrationRequest): Promise<MigrationHandle>;
  cleanupTemporaryArtifacts(): Promise<void>;
  requestRestart(request: RestartRequest): Promise<void>;
}

export interface InstallationOptions {
  readonly packagePath: string;
  readonly extractionPath: string;
  readonly backupPath: string;
  readonly applicationPath: string;
  readonly currentVersion: string;
  readonly targetVersion: string;
}

export type InstallationProgressListener = (
  progress: InstallationProgress
) => void;

export class PackageInstaller {
  private readonly gateway: InstallationGateway;
  private readonly options: InstallationOptions;
  private readonly onProgress: InstallationProgressListener | undefined;

  private stage: InstallationStage;
  private backupHandle: BackupHandle | undefined;
  private extractionHandle: ExtractionHandle | undefined;
  private replacementHandle: FileReplacementHandle | undefined;
  private migrationHandle: MigrationHandle | undefined;

  public constructor(
    gateway: InstallationGateway,
    options: InstallationOptions,
    onProgress?: InstallationProgressListener
  ) {
    this.gateway = gateway;
    this.options = options;
    this.onProgress = onProgress;
    this.stage = "Preparing";
  }

  public async initialize(): Promise<void> {
    this.stage = "Preparing";
    this.backupHandle = undefined;
    this.extractionHandle = undefined;
    this.replacementHandle = undefined;
    this.migrationHandle = undefined;

    this.emitProgress(0, undefined);
  }

  public async prepareInstallation(): Promise<void> {
    this.stage = "Preparing";
    this.emitProgress(5, undefined);
  }

  public async backupCurrentFiles(): Promise<BackupHandle> {
    this.stage = "BackingUp";
    this.emitProgress(15, this.options.applicationPath);

    const backupRequest: BackupRequest = {
      sourcePath: this.options.applicationPath,
      backupPath: this.options.backupPath,
      requestedAt: new Date(),
    };

    const backupHandle = await this.gateway.createBackup(backupRequest);
    this.backupHandle = backupHandle;

    this.emitProgress(30, undefined);

    return backupHandle;
  }

  public async extractPackage(): Promise<ExtractionHandle> {
    this.stage = "Extracting";
    this.emitProgress(35, this.options.packagePath);

    const extractionRequest: ExtractionRequest = {
      packagePath: this.options.packagePath,
      destinationPath: this.options.extractionPath,
      requestedAt: new Date(),
    };

    const extractionHandle = await this.gateway.extractPackage(
      extractionRequest
    );
    this.extractionHandle = extractionHandle;

    this.emitProgress(50, undefined);

    return extractionHandle;
  }

  public async replaceFiles(): Promise<FileReplacementHandle> {
    if (this.extractionHandle === undefined) {
      throw new Error(
        "Package must be extracted before files can be replaced."
      );
    }

    this.stage = "ReplacingFiles";
    this.emitProgress(60, this.extractionHandle.extractedPath);

    const replacementRequest: FileReplacementRequest = {
      sourcePath: this.extractionHandle.extractedPath,
      targetPath: this.options.applicationPath,
      requestedAt: new Date(),
    };

    const replacementHandle = await this.gateway.replaceFiles(
      replacementRequest
    );
    this.replacementHandle = replacementHandle;

    this.emitProgress(75, undefined);

    return replacementHandle;
  }

  public async runMigrations(): Promise<MigrationHandle> {
    this.stage = "RunningMigrations";
    this.emitProgress(80, undefined);

    const migrationRequest: MigrationRequest = {
      fromVersion: this.options.currentVersion,
      toVersion: this.options.targetVersion,
      requestedAt: new Date(),
    };

    const migrationHandle = await this.gateway.runMigrations(
      migrationRequest
    );
    this.migrationHandle = migrationHandle;

    this.emitProgress(90, undefined);

    return migrationHandle;
  }

  public async finalizeInstallation(): Promise<InstallationResult> {
    if (
      this.replacementHandle === undefined ||
      this.migrationHandle === undefined
    ) {
      this.stage = "Failed";
      this.emitProgress(this.currentPercentageForStage(), undefined);

      return {
        successful: false,
        installedVersion: this.options.currentVersion,
        restartRequired: false,
        rollbackAvailable: this.backupHandle !== undefined,
        message:
          "Installation could not be finalized because required stages did not complete.",
      };
    }

    this.stage = "Completed";
    this.emitProgress(95, undefined);

    return {
      successful: true,
      installedVersion: this.options.targetVersion,
      restartRequired: true,
      rollbackAvailable: this.backupHandle !== undefined,
      message: "Installation finalized successfully.",
    };
  }

  public async restartApplication(): Promise<void> {
    this.stage = "Restarting";
    this.emitProgress(98, undefined);

    const restartRequest: RestartRequest = {
      reason: "Update installation completed.",
      requestedAt: new Date(),
    };

    await this.gateway.requestRestart(restartRequest);
  }

  public async cleanup(): Promise<void> {
    this.stage = "CleaningUp";
    this.emitProgress(99, undefined);

    await this.gateway.cleanupTemporaryArtifacts();

    this.stage = "Completed";
    this.emitProgress(100, undefined);
  }

  private emitProgress(percentage: number, currentFile: string | undefined): void {
    if (this.onProgress === undefined) {
      return;
    }

    const progress: InstallationProgress = {
      currentStage: this.stage,
      percentage,
      currentFile,
    };

    this.onProgress(progress);
  }

  private currentPercentageForStage(): number {
    switch (this.stage) {
      case "Preparing":
        return 5;
      case "BackingUp":
        return 30;
      case "Extracting":
        return 50;
      case "ReplacingFiles":
        return 75;
      case "RunningMigrations":
        return 90;
      case "CleaningUp":
        return 99;
      case "Restarting":
        return 98;
      case "Completed":
        return 100;
      case "Failed":
        return 0;
    }
  }
}