export type InstallationExecutionStatus =
  | "Succeeded"
  | "Failed";

export interface InstalledFileRecord {
  readonly relativePath: string;
  readonly sizeInBytes: number;
}

export interface InstallationExecutionFailure {
  readonly code: string;
  readonly message: string;
  readonly filePath: string | undefined;
}

export interface InstallationExecutionResult {
  readonly status: InstallationExecutionStatus;
  readonly targetVersion: string;
  readonly installedFiles: ReadonlyArray<InstalledFileRecord>;
  readonly failures: ReadonlyArray<InstallationExecutionFailure>;
  readonly durationMs: number;
  readonly completedAt: Date;
}