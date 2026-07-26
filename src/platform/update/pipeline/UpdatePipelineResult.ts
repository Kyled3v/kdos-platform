import type { IUpdateManifest } from "../manifest/IUpdateManifest";
import type { ChecksumResult } from "../verification/ChecksumResult";
import type { InstallationExecutionResult } from "../installation/InstallationExecutionResult";

export type UpdatePipelineStatus =
  | "UpToDate"
  | "Succeeded"
  | "FailedAtUpdateCheck"
  | "FailedAtVerification"
  | "FailedAtInstallation";

export interface UpdatePipelineResult {
  readonly status: UpdatePipelineStatus;

  readonly currentVersion: string;

  readonly manifest?: IUpdateManifest;

  /**
   * Result of package integrity verification.
   */
  readonly verificationResult?: ChecksumResult;

  readonly installationResult?: InstallationExecutionResult;

  readonly errorMessage?: string;

  readonly completedAt: Date;
}