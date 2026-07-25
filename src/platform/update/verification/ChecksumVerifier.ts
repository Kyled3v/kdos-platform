/**
 * src/platform/update/verification/ChecksumVerifier.ts
 *
 * Production implementation of IChecksumVerifier.
 *
 * Delegates file hashing to an injected IFileHashProvider so the hash
 * computation can be replaced without modifying this class.
 *
 * Does NOT download files.
 * Does NOT install updates.
 * Does NOT restart KDOS.
 * Does NOT communicate with GitHub.
 */

import { timingSafeEqual } from 'crypto';

import type { IChecksumVerifier, VerifyChecksumOptions } from './IChecksumVerifier';
import type { IFileHashProvider }                        from './FileHashProvider';
import { NodeFileHashProvider }                          from './FileHashProvider';
import {
  ChecksumResult,
  ChecksumVerificationError,
} from './ChecksumResult';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

function normaliseChecksum(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidSha256Hex(value: string): boolean {
  return SHA256_HEX_PATTERN.test(value);
}

/**
 * Constant-time hex string comparison via timingSafeEqual.
 * Prevents timing side-channels when comparing hash digests.
 */
function safeCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');

  // Buffer lengths must be equal for timingSafeEqual — guaranteed above
  // because both inputs have the same length and are valid hex strings.
  return timingSafeEqual(aBuf, bBuf);
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class ChecksumVerifier implements IChecksumVerifier {
  private readonly hashProvider: IFileHashProvider;

  /**
   * @param hashProvider - Injected hash implementation.
   *                       Defaults to NodeFileHashProvider (production).
   */
  public constructor(hashProvider: IFileHashProvider = new NodeFileHashProvider()) {
    this.hashProvider = hashProvider;
  }

  public async verify(options: VerifyChecksumOptions): Promise<ChecksumResult> {
    const { filePath, expectedChecksum } = options;

    const normalised = normaliseChecksum(expectedChecksum);

    // Validate the expected checksum before touching the filesystem.
    if (!isValidSha256Hex(normalised)) {
      return {
        verified:          false,
        status:            'invalid_expected_checksum',
        filePath,
        expectedChecksum:  normalised,
        actualChecksum:    null,
        failureReason:
          `Expected checksum "${expectedChecksum}" is not a valid SHA-256 hex digest ` +
          `(must be exactly 64 lowercase hex characters).`,
      };
    }

    let actualChecksum: string;

    try {
      actualChecksum = await this.hashProvider.sha256(filePath);
    } catch (error) {
      if (error instanceof ChecksumVerificationError) {
        return {
          verified:         false,
          status:           'read_error',
          filePath,
          expectedChecksum: normalised,
          actualChecksum:   null,
          failureReason:    error.message,
        };
      }

      // Re-throw genuinely unexpected errors (disk failure mid-read, etc.)
      throw error;
    }

    const match = safeCompareHex(actualChecksum, normalised);

    if (match) {
      return {
        verified:         true,
        status:           'match',
        filePath,
        expectedChecksum: normalised,
        actualChecksum,
      };
    }

    return {
      verified:         false,
      status:           'mismatch',
      filePath,
      expectedChecksum: normalised,
      actualChecksum,
      failureReason:
        `SHA-256 mismatch for "${filePath}". ` +
        `Expected: ${normalised}. ` +
        `Actual:   ${actualChecksum}.`,
    };
  }
}