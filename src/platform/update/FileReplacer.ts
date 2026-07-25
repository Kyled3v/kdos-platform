/**
 * FileReplacer
 *
 * Compares extracted package files against the installed application
 * files, replaces only those that have changed, preserves file
 * permissions, and returns a complete record of every operation
 * performed. All filesystem operations are delegated to
 * FileReplacerGateway.
 */

import { ExtractedFileRecord } from "./PackageExtractor";

export interface FileReplacerGateway {
  computeSha256(absoluteFilePath: string): Promise<string>;
  fileExists(absoluteFilePath: string): Promise<boolean>;
  copyFile(
    absoluteSourcePath: string,
    absoluteDestinationPath: string
  ): Promise<void>;
  getPermissions(absoluteFilePath: string): Promise<number>;
  setPermissions(absoluteFilePath: string, mode: number): Promise<void>;
  createParentDirectories(absoluteFilePath: string): Promise<void>;
  joinPath(...segments: ReadonlyArray<string>): string;
}

export type FileReplacementOutcome = "Replaced" | "Skipped" | "Added" | "Failed";

export interface FileOperationRecord {
  readonly relativePath: string;
  readonly outcome: FileReplacementOutcome;
  readonly reason: string;
}

export interface FileReplacementResult {
  readonly operations: ReadonlyArray<FileOperationRecord>;
  readonly replacedFiles: ReadonlyArray<string>;
  readonly skippedFiles: ReadonlyArray<string>;
  readonly addedFiles: ReadonlyArray<string>;
  readonly failedFiles: ReadonlyArray<string>;
}

export interface FileReplacerOptions {
  readonly applicationInstallPath: string;
}

export class FileReplacer {
  private readonly gateway: FileReplacerGateway;
  private readonly options: FileReplacerOptions;

  public constructor(
    gateway: FileReplacerGateway,
    options: FileReplacerOptions
  ) {
    this.gateway = gateway;
    this.options = options;
  }

  public async replaceFiles(
    extractedFiles: ReadonlyArray<ExtractedFileRecord>
  ): Promise<FileReplacementResult> {
    const operations: FileOperationRecord[] = [];

    for (const extracted of extractedFiles) {
      const record = await this.processFile(extracted);
      operations.push(record);
    }

    return {
      operations,
      replacedFiles: operations
        .filter((op) => op.outcome === "Replaced")
        .map((op) => op.relativePath),
      skippedFiles: operations
        .filter((op) => op.outcome === "Skipped")
        .map((op) => op.relativePath),
      addedFiles: operations
        .filter((op) => op.outcome === "Added")
        .map((op) => op.relativePath),
      failedFiles: operations
        .filter((op) => op.outcome === "Failed")
        .map((op) => op.relativePath),
    };
  }

  private async processFile(
    extracted: ExtractedFileRecord
  ): Promise<FileOperationRecord> {
    const targetPath = this.gateway.joinPath(
      this.options.applicationInstallPath,
      extracted.relativePath
    );

    try {
      const targetExists = await this.gateway.fileExists(targetPath);

      if (targetExists) {
        const targetChecksum = await this.gateway.computeSha256(targetPath);
        const normalizedTarget = targetChecksum.toLowerCase().trim();
        const normalizedSource = extracted.checksum.toLowerCase().trim();

        if (normalizedTarget === normalizedSource) {
          return {
            relativePath: extracted.relativePath,
            outcome: "Skipped",
            reason: "File is identical to the installed version.",
          };
        }

        const existingPermissions = await this.gateway.getPermissions(targetPath);
        await this.gateway.createParentDirectories(targetPath);
        await this.gateway.copyFile(extracted.absolutePath, targetPath);
        await this.gateway.setPermissions(targetPath, existingPermissions);

        return {
          relativePath: extracted.relativePath,
          outcome: "Replaced",
          reason: "File checksum differs from the installed version.",
        };
      }

      await this.gateway.createParentDirectories(targetPath);
      await this.gateway.copyFile(extracted.absolutePath, targetPath);

      return {
        relativePath: extracted.relativePath,
        outcome: "Added",
        reason: "File does not exist in the current installation.",
      };
    } catch (error) {
      return {
        relativePath: extracted.relativePath,
        outcome: "Failed",
        reason:
          error instanceof Error
            ? error.message
            : "An unknown error occurred during file replacement.",
      };
    }
  }
}