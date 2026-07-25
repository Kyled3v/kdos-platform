/**
 * PackageVerifier
 *
 * Responsible for validating a generated update package.
 *
 * PackageVerifier NEVER installs packages.
 * PackageVerifier NEVER modifies files.
 * PackageVerifier ONLY validates.
 */

import { Manifest, ManifestFileEntry } from "./Manifest";
import { FileSystemGateway, ChecksumGateway } from "./PackageBuilder";

export type VerificationSeverity = "Information" | "Warning" | "Error" | "Critical";

export interface VerificationIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: VerificationSeverity;
}

export interface VerificationOutcome {
  readonly successful: boolean;
  readonly issues: ReadonlyArray<VerificationIssue>;
}

export interface PackageVerificationReport {
  readonly overallSuccessful: boolean;
  readonly manifestResult: VerificationOutcome;
  readonly checksumResult: VerificationOutcome;
  readonly filesResult: VerificationOutcome;
  readonly versionResult: VerificationOutcome;
  readonly verifiedAt: Date;
}

export interface PackageVerifierOptions {
  readonly extractedPackagePath: string;
  readonly currentApplicationVersion: string;
}

const CHECKSUM_MISMATCH_CODE = "CHECKSUM_MISMATCH";
const CHECKSUM_FILE_NOT_FOUND_CODE = "CHECKSUM_FILE_NOT_FOUND";

export class PackageVerifier {
  private readonly fileSystem: FileSystemGateway;
  private readonly checksums: ChecksumGateway;
  private readonly options: PackageVerifierOptions;

  public constructor(
    fileSystem: FileSystemGateway,
    checksums: ChecksumGateway,
    options: PackageVerifierOptions
  ) {
    this.fileSystem = fileSystem;
    this.checksums = checksums;
    this.options = options;
  }

  public async verifyManifest(manifest: Manifest): Promise<VerificationOutcome> {
    const issues: VerificationIssue[] = [];

    if (manifest.applicationName.length === 0) {
      issues.push({
        code: "MANIFEST_MISSING_APPLICATION_NAME",
        message: "Manifest is missing an application name.",
        severity: "Critical",
      });
    }

    if (manifest.applicationVersion.length === 0) {
      issues.push({
        code: "MANIFEST_MISSING_VERSION",
        message: "Manifest is missing an application version.",
        severity: "Critical",
      });
    }

    if (manifest.packageName.length === 0) {
      issues.push({
        code: "MANIFEST_MISSING_PACKAGE_NAME",
        message: "Manifest is missing a package name.",
        severity: "Critical",
      });
    }

    if (manifest.fileList.length === 0) {
      issues.push({
        code: "MANIFEST_EMPTY_FILE_LIST",
        message: "Manifest file list is empty.",
        severity: "Error",
      });
    }

    if (manifest.packageSize <= 0) {
      issues.push({
        code: "MANIFEST_INVALID_PACKAGE_SIZE",
        message: "Manifest package size must be greater than zero.",
        severity: "Error",
      });
    }

    return {
      successful: issues.every(
        (issue) => issue.severity !== "Critical" && issue.severity !== "Error"
      ),
      issues,
    };
  }

  public async verifyChecksum(entry: ManifestFileEntry): Promise<VerificationOutcome> {
    const issues: VerificationIssue[] = [];
    const absolutePath = this.fileSystem.joinPath(
      this.options.extractedPackagePath,
      entry.relativePath
    );

    const exists = await this.fileSystem.pathExists(absolutePath);

    if (!exists) {
      issues.push({
        code: CHECKSUM_FILE_NOT_FOUND_CODE,
        message: `File referenced in manifest was not found: ${entry.relativePath}`,
        severity: "Critical",
      });

      return { successful: false, issues };
    }

    const actualChecksum = await this.checksums.computeFileChecksum(absolutePath);

    if (actualChecksum !== entry.checksum) {
      issues.push({
        code: CHECKSUM_MISMATCH_CODE,
        message: `Checksum mismatch for file: ${entry.relativePath}`,
        severity: "Critical",
      });
    }

    return {
      successful: issues.length === 0,
      issues,
    };
  }

  public async verifyFiles(manifest: Manifest): Promise<VerificationOutcome> {
    const issues: VerificationIssue[] = [];

    for (const entry of manifest.fileList) {
      const outcome = await this.verifyChecksum(entry);
      issues.push(...outcome.issues);
    }

    return {
      successful: issues.every((issue) => issue.severity !== "Critical"),
      issues,
    };
  }

  public async verifyVersion(manifest: Manifest): Promise<VerificationOutcome> {
    const issues: VerificationIssue[] = [];

    if (manifest.applicationVersion === this.options.currentApplicationVersion) {
      issues.push({
        code: "VERSION_NOT_NEWER",
        message: "Package version is not newer than the currently installed version.",
        severity: "Warning",
      });
    }

    return {
      successful: issues.every(
        (issue) => issue.severity !== "Critical" && issue.severity !== "Error"
      ),
      issues,
    };
  }

  public async verifyPackage(manifest: Manifest): Promise<PackageVerificationReport> {
    const manifestResult = await this.verifyManifest(manifest);
    const filesResult = await this.verifyFiles(manifest);
    const versionResult = await this.verifyVersion(manifest);

    const checksumIssues = filesResult.issues.filter(
      (issue) => issue.code === CHECKSUM_MISMATCH_CODE || issue.code === CHECKSUM_FILE_NOT_FOUND_CODE
    );

    const checksumResult: VerificationOutcome = {
      successful: checksumIssues.length === 0,
      issues: checksumIssues,
    };

    const overallSuccessful =
      manifestResult.successful && filesResult.successful && checksumResult.successful;

    return {
      overallSuccessful,
      manifestResult,
      checksumResult,
      filesResult,
      versionResult,
      verifiedAt: new Date(),
    };
  }
}