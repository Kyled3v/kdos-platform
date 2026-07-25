import type { IUpdateManifest } from "../manifest/IUpdateManifest";
import type { PackageVerificationReport } from "../PackageVerifier";
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
  readonly manifest: IUpdateManifest | undefined;
  readonly verificationReport: PackageVerificationReport | undefined;
  readonly installationResult: InstallationExecutionResult | undefined;
  readonly errorMessage: string | undefined;
  readonly completedAt: Date;
}