/**
 * src/platform/update/verification/ChecksumResult.ts
 *
 * Structured result and error types for SHA-256 checksum verification.
 *
 * No I/O. No downloads. No installer logic. Pure data.
 */

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export type ChecksumVerificationStatus =
  /** Computed hash matches the expected hash exactly. */
  | 'match'
  /** Computed hash does not match the expected hash. */
  | 'mismatch'
  /** The file could not be read or hashed. */
  | 'read_error'
  /** The expected checksum string failed structural validation. */
  | 'invalid_expected_checksum';

export interface ChecksumResult {
  /** Whether the file hash matched the expected checksum. */
  readonly verified: boolean;

  /** Discriminated status describing the outcome in detail. */
  readonly status: ChecksumVerificationStatus;

  /** Absolute path of the file that was verified. */
  readonly filePath: string;

  /**
   * The expected SHA-256 hex digest supplied by the caller.
   * Always lowercase when verification proceeds past input validation.
   */
  readonly expectedChecksum: string;

  /**
   * The SHA-256 hex digest computed from the file on disk.
   * Null when status is 'read_error' or 'invalid_expected_checksum'
   * because hashing did not complete successfully.
   */
  readonly actualChecksum: string | null;

  /**
   * Human-readable description of a failure.
   * Undefined when verified is true.
   */
  readonly failureReason?: string;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export type ChecksumErrorCode =
  | 'invalid_expected_checksum'
  | 'file_not_found'
  | 'file_read_error'
  | 'hash_computation_error';

export class ChecksumVerificationError extends Error {
  public readonly code:  ChecksumErrorCode;
  public readonly cause: unknown;

  constructor(code: ChecksumErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name  = 'ChecksumVerificationError';
    this.code  = code;
    this.cause = cause;
  }
}