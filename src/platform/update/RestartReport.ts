/**
 * RestartReport
 *
 * Records the full outcome of a KDOS restart sequence initiated
 * after a successful update installation.
 */

export interface RestartError {
  readonly code: string;
  readonly message: string;
}

export interface RestartReport {
  readonly previousVersion: string;
  readonly newVersion: string;
  readonly restartDurationMs: number;
  readonly successful: boolean;
  readonly errors: ReadonlyArray<RestartError>;
  readonly completedAt: Date;
}

export function buildSuccessfulRestartReport(
  previousVersion: string,
  newVersion: string,
  restartDurationMs: number
): RestartReport {
  return {
    previousVersion,
    newVersion,
    restartDurationMs,
    successful: true,
    errors: [],
    completedAt: new Date(),
  };
}

export function buildFailedRestartReport(
  previousVersion: string,
  newVersion: string,
  restartDurationMs: number,
  errors: ReadonlyArray<RestartError>
): RestartReport {
  return {
    previousVersion,
    newVersion,
    restartDurationMs,
    successful: false,
    errors,
    completedAt: new Date(),
  };
}