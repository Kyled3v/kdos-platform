/**
 * GitHubVerifier
 *
 * Orchestrates the complete verification workflow for a downloaded
 * KDOS GitHub release package:
 *   1. Read version.json and parse the GitHubManifest
 *   2. Load the downloaded package
 *   3. Validate checksum (SHA-256)
 *   4. Validate signature
 *   5. Validate package size
 *   6. Return a detailed GitHubVerificationReport
 *
 * GitHubVerifier performs no filesystem access directly; all I/O is
 * delegated to an injected gateway.
 */

import { GitHubManifest, parseGitHubManifest } from "./GitHubManifest";
import { ChecksumValidator, ChecksumValidationResult } from "./ChecksumValidator";
import { SignatureValidator, SignatureValidationResult, SignatureSource } from "./SignatureValidator";

export interface GitHubVerifierStorageGateway {
  readTextFile(absoluteFilePath: string): Promise<string>;
  getFileSize(absoluteFilePath: string): Promise<number>;
}

export interface GitHubVerifierOptions {
  readonly absoluteManifestPath: string;
  readonly absolutePackagePath: string;
  readonly signatureSource: SignatureSource;
}

export type GitHubVerificationStatus = "Passed" | "Failed";

export interface PackageSizeValidationResult {
  readonly status: "Passed" | "Failed";
  readonly expectedBytes: number;
  readonly actualBytes: number;
  readonly validatedAt: Date;
  readonly message: string;
}

export interface GitHubVerificationReport {
  readonly overallStatus: GitHubVerificationStatus;
  readonly manifest: GitHubManifest | undefined;
  readonly checksumResult: ChecksumValidationResult | undefined;
  readonly signatureResult: SignatureValidationResult | undefined;
  readonly sizeResult: PackageSizeValidationResult | undefined;
  readonly verifiedAt: Date;
  readonly failureReason: string | undefined;
}

export class GitHubVerifier {
  private readonly storage: GitHubVerifierStorageGateway;
  private readonly checksumValidator: ChecksumValidator;
  private readonly signatureValidator: SignatureValidator;

  public constructor(
    storage: GitHubVerifierStorageGateway,
    checksumValidator: ChecksumValidator,
    signatureValidator: SignatureValidator
  ) {
    this.storage = storage;
    this.checksumValidator = checksumValidator;
    this.signatureValidator = signatureValidator;
  }

  public async verify(options: GitHubVerifierOptions): Promise<GitHubVerificationReport> {
    const verifiedAt = new Date();

    let manifest: GitHubManifest;

    try {
      const manifestJson = await this.storage.readTextFile(options.absoluteManifestPath);
      manifest = parseGitHubManifest(manifestJson);
    } catch (error) {
      return {
        overallStatus: "Failed",
        manifest: undefined,
        checksumResult: undefined,
        signatureResult: undefined,
        sizeResult: undefined,
        verifiedAt,
        failureReason:
          error instanceof Error
            ? `Failed to read or parse version.json: ${error.message}`
            : "Failed to read or parse version.json.",
      };
    }

    const checksumResult = await this.checksumValidator.validate(
      options.absolutePackagePath,
      manifest.sha256
    );

    if (checksumResult.status !== "Passed") {
      return {
        overallStatus: "Failed",
        manifest,
        checksumResult,
        signatureResult: undefined,
        sizeResult: undefined,
        verifiedAt,
        failureReason: checksumResult.message,
      };
    }

    const signatureResult = await this.signatureValidator.validate(
      options.absolutePackagePath,
      options.signatureSource
    );

    if (signatureResult.status !== "Passed") {
      return {
        overallStatus: "Failed",
        manifest,
        checksumResult,
        signatureResult,
        sizeResult: undefined,
        verifiedAt,
        failureReason: signatureResult.message,
      };
    }

    const sizeResult = await this.validatePackageSize(
      options.absolutePackagePath,
      manifest.packageSize
    );

    if (sizeResult.status !== "Passed") {
      return {
        overallStatus: "Failed",
        manifest,
        checksumResult,
        signatureResult,
        sizeResult,
        verifiedAt,
        failureReason: sizeResult.message,
      };
    }

    return {
      overallStatus: "Passed",
      manifest,
      checksumResult,
      signatureResult,
      sizeResult,
      verifiedAt,
      failureReason: undefined,
    };
  }

  private async validatePackageSize(
    absolutePackagePath: string,
    expectedBytes: number
  ): Promise<PackageSizeValidationResult> {
    const validatedAt = new Date();
    let actualBytes: number;

    try {
      actualBytes = await this.storage.getFileSize(absolutePackagePath);
    } catch (error) {
      return {
        status: "Failed",
        expectedBytes,
        actualBytes: -1,
        validatedAt,
        message:
          error instanceof Error
            ? `Could not read package file size: ${error.message}`
            : "Could not read package file size.",
      };
    }

    const passed = actualBytes === expectedBytes;

    return {
      status: passed ? "Passed" : "Failed",
      expectedBytes,
      actualBytes,
      validatedAt,
      message: passed
        ? "Package size matches the manifest."
        : `Package size mismatch: expected ${expectedBytes} bytes, got ${actualBytes} bytes.`,
    };
  }
}