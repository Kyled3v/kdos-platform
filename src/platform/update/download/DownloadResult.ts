/**
 * src/platform/update/download/DownloadResult.ts
 *
 * Structured result and error types returned by IUpdateDownloader.
 *
 * No HTTP. No file I/O. No UI. Pure data.
 */

// ---------------------------------------------------------------------------
// Success result
// ---------------------------------------------------------------------------

export interface DownloadResult {
  /** Absolute path to the downloaded installer on disk. */
  readonly filePath: string;

  /** File name of the downloaded installer (matches UpdateManifest.installerName). */
  readonly installerName: string;

  /** Total bytes written to disk. */
  readonly sizeBytes: number;

  /**
   * True when the download resumed a previous partial file.
   * False for full downloads or when the server did not honour Range requests.
   */
  readonly resumed: boolean;

  /** ISO-8601 UTC timestamp of when the download completed. */
  readonly completedAt: string;
}

// ---------------------------------------------------------------------------
// Failure
// ---------------------------------------------------------------------------

export type DownloadFailureReason =
  /** Server responded with a non-success, non-206 HTTP status. */
  | 'http_error'
  /** Network connection failed or was interrupted before completion. */
  | 'network_error'
  /** The download was cancelled via AbortSignal before completing. */
  | 'cancelled'
  /** The temporary directory could not be created or written to. */
  | 'filesystem_error'
  /** The response body stream closed before all bytes were received. */
  | 'incomplete_transfer'
  /** An unexpected error occurred that does not fit the above categories. */
  | 'unknown';

export class DownloadError extends Error {
  public readonly reason:     DownloadFailureReason;
  public readonly statusCode: number | null;
  public readonly cause:      unknown;

  constructor(
    reason:  DownloadFailureReason,
    message: string,
    options: { statusCode?: number; cause?: unknown } = {},
  ) {
    super(message);
    this.name       = 'DownloadError';
    this.reason     = reason;
    this.statusCode = options.statusCode ?? null;
    this.cause      = options.cause;
  }
}