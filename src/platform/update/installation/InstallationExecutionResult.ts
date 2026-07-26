/**
 * InstallationExecutionResult.ts
 *
 * Canonical installer execution result.
 */

export enum InstallationExecutionStatus {
  Success = "Success",
  Failed = "Failed",
  Cancelled = "Cancelled"
}

export interface InstalledFileRecord {
  readonly source: string;
  readonly destination: string;
  readonly checksum: string;
}

export interface InstallationExecutionFailure {
  readonly code: string;
  readonly message: string;
  readonly details?: string;
}

export interface InstallationExecutionResult {
  readonly status: InstallationExecutionStatus;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly installedFiles: readonly InstalledFileRecord[];
  readonly failure?: InstallationExecutionFailure;
}