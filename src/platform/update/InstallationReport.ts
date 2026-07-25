/**
 * InstallationReport
 *
 * Records the full outcome of a KDOS package installation attempt.
 */

export interface InstallationError {
  readonly code: string;
  readonly message: string;
  readonly filePath: string | undefined;
}

export interface InstallationReport {
  readonly installedVersion: string;
  readonly installedFiles: ReadonlyArray<string>;
  readonly failedFiles: ReadonlyArray<string>;
  readonly durationMs: number;
  readonly successful: boolean;
  readonly errors: ReadonlyArray<InstallationError>;
  readonly completedAt: Date;
}

export function buildSuccessfulReport(
  installedVersion: string,
  installedFiles: ReadonlyArray<string>,
  durationMs: number
): InstallationReport {
  return {
    installedVersion,
    installedFiles,
    failedFiles: [],
    durationMs,
    successful: true,
    errors: [],
    completedAt: new Date(),
  };
}

export function buildFailedReport(
  installedVersion: string,
  installedFiles: ReadonlyArray<string>,
  failedFiles: ReadonlyArray<string>,
  errors: ReadonlyArray<InstallationError>,
  durationMs: number
): InstallationReport {
  return {
    installedVersion,
    installedFiles,
    failedFiles,
    durationMs,
    successful: false,
    errors,
    completedAt: new Date(),
  };
}