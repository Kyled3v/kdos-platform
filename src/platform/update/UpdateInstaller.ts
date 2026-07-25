/**
 * UpdateInstaller
 *
 * Coordinates the complete KDOS package installation sequence:
 *   1. Create a backup via BackupManager before touching any files
 *   2. Extract the .kdos package via PackageExtractor
 *   3. Validate extracted contents
 *   4. Replace changed application files via FileReplacer
 *   5. Return a detailed InstallationReport
 *
 * On any unrecoverable failure, UpdateInstaller throws an
 * UpdateInstallationError so the caller can trigger rollback via
 * RollbackManager using the backup that was taken in step 1.
 */

import { PackageExtractor } from "./PackageExtractor";
import { FileReplacer } from "./FileReplacer";
import {
  InstallationReport,
  InstallationError,
  buildSuccessfulReport,
  buildFailedReport,
} from "./InstallationReport";
import { BackupManager } from "./BackupManager";

export interface UpdateInstallerOptions {
  readonly targetVersion: string;
  readonly absolutePackagePath: string;
}

export class UpdateInstallationError extends Error {
  public readonly partialReport: InstallationReport;

  public constructor(message: string, partialReport: InstallationReport) {
    super(message);
    this.name = "UpdateInstallationError";
    this.partialReport = partialReport;
  }
}

export class UpdateInstaller {
  private readonly extractor: PackageExtractor;
  private readonly replacer: FileReplacer;
  private readonly backupManager: BackupManager;

  public constructor(
    extractor: PackageExtractor,
    replacer: FileReplacer,
    backupManager: BackupManager
  ) {
    this.extractor = extractor;
    this.replacer = replacer;
    this.backupManager = backupManager;
  }

  public async install(options: UpdateInstallerOptions): Promise<InstallationReport> {
    const startedAt = Date.now();

    await this.backupManager.createBackup();

    let extractionResult: Awaited<ReturnType<PackageExtractor["extract"]>>;

    try {
      extractionResult = await this.extractor.extract(options.absolutePackagePath);
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const extractionError: InstallationError = {
        code: "EXTRACTION_FAILED",
        message:
          error instanceof Error ? error.message : "Package extraction failed.",
        filePath: options.absolutePackagePath,
      };

      const report = buildFailedReport(
        options.targetVersion,
        [],
        [],
        [extractionError],
        durationMs
      );

      throw new UpdateInstallationError("Package extraction failed.", report);
    }

    const invalidFiles = await this.extractor.validate(extractionResult);

    if (invalidFiles.length > 0) {
      const durationMs = Date.now() - startedAt;
      const errors: InstallationError[] = invalidFiles.map((relativePath) => ({
        code: "CHECKSUM_MISMATCH",
        message: `Extracted file failed checksum validation: ${relativePath}`,
        filePath: relativePath,
      }));

      const report = buildFailedReport(
        options.targetVersion,
        [],
        invalidFiles,
        errors,
        durationMs
      );

      throw new UpdateInstallationError(
        "Extracted package contents failed validation.",
        report
      );
    }

    const replacementResult = await this.replacer.replaceFiles(
      extractionResult.extractedFiles
    );

    const durationMs = Date.now() - startedAt;

    if (replacementResult.failedFiles.length > 0) {
      const errors: InstallationError[] = replacementResult.operations
        .filter((op) => op.outcome === "Failed")
        .map((op) => ({
          code: "FILE_REPLACEMENT_FAILED",
          message: op.reason,
          filePath: op.relativePath,
        }));

      const installedFiles = [
        ...replacementResult.replacedFiles,
        ...replacementResult.addedFiles,
      ];

      const report = buildFailedReport(
        options.targetVersion,
        installedFiles,
        replacementResult.failedFiles,
        errors,
        durationMs
      );

      throw new UpdateInstallationError(
        `${replacementResult.failedFiles.length} file(s) could not be replaced.`,
        report
      );
    }

    const installedFiles = [
      ...replacementResult.replacedFiles,
      ...replacementResult.addedFiles,
    ];

    return buildSuccessfulReport(options.targetVersion, installedFiles, durationMs);
  }
}
