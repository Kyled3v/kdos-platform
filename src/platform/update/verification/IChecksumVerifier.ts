/**
 * src/platform/update/verification/IChecksumVerifier.ts
 *
 * Production contract for SHA-256 checksum verification of downloaded
 * KDOS installer packages.
 *
 * Consumed by UpdatePipeline after IUpdateDownloader completes.
 * No caller beneath this interface touches the filesystem directly.
 *
 * Responsibilities declared here
 *   - Compute the SHA-256 hash of a file on disk
 *   - Compare it against the expected checksum from UpdateManifest
 *   - Return a structured ChecksumResult describing the outcome
 *
 * Explicitly out of scope
 *   - Downloading files              (IUpdateDownloader)
 *   - Installing updates             (UpdateInstaller)
 *   - Restarting KDOS               (RestartManager)
 *   - GitHub API communication       (IGitHubReleaseProvider)
 */

import type { ChecksumResult } from './ChecksumResult';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface VerifyChecksumOptions {
  /**
   * Absolute path to the downloaded installer file.
   * Must exist on disk before verify() is called.
   */
  readonly filePath: string;

  /**
   * Expected SHA-256 hex digest sourced from UpdateManifest.sha256Checksum.
   * Must be a 64-character lowercase hex string.
   * verify() normalises to lowercase before comparison.
   */
  readonly expectedChecksum: string;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IChecksumVerifier {
  /**
   * Computes the SHA-256 hash of the file at options.filePath and compares
   * it against options.expectedChecksum using a constant-time byte comparison.
   *
   * Always returns a ChecksumResult — never throws for hash mismatches or
   * structural validation failures. Those outcomes are encoded as result fields.
   *
   * Throws ChecksumVerificationError only when an unexpected I/O error
   * prevents the computation from completing at all (e.g. disk failure mid-read
   * that is not a file-not-found condition handled by the result model).
   *
   * @param options - File path and expected checksum.
   * @returns       A structured ChecksumResult describing the outcome.
   */
  verify(options: VerifyChecksumOptions): Promise<ChecksumResult>;
}