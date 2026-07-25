/**
 * src/platform/update/version/IVersionComparator.ts
 *
 * Production contract for semantic version comparison within the KDOS
 * update platform.
 *
 * Consumed by UpdateService and UpdatePipeline. No caller compares
 * versions directly — all comparison flows through this interface.
 */

import type { SemanticVersion } from './SemanticVersion';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/**
 * Numeric ordering result returned by compare().
 *
 *  -1  local is older  than remote  (update available)
 *   0  local equals        remote   (up to date)
 *   1  local is newer  than remote  (local is ahead)
 *
 * Strictly -1 / 0 / 1 rather than an arbitrary integer so callers can
 * switch on the value without range checks.
 */
export type VersionOrder = -1 | 0 | 1;

export interface VersionComparisonResult {
  /** Normalised ordering of local vs remote. */
  readonly order:           VersionOrder;

  /** True when remote is strictly newer than local. */
  readonly updateAvailable: boolean;

  /** The parsed local version. */
  readonly localVersion:    SemanticVersion;

  /** The parsed remote version. */
  readonly remoteVersion:   SemanticVersion;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class VersionComparatorError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'VersionComparatorError';
  }
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IVersionComparator {
  /**
   * Compares a locally installed version string against a remote version string.
   *
   * Both strings are parsed as semantic versions before comparison.
   * Parsing follows semver 2.0.0: MAJOR.MINOR.PATCH with optional
   * prerelease and build metadata. A leading "v" or "V" is accepted.
   *
   * @param localVersion  - Version string of the installed KDOS build.
   * @param remoteVersion - Version string from the latest GitHub release.
   * @returns             A VersionComparisonResult with ordering and parsed versions.
   * @throws              VersionComparatorError when either string cannot be parsed.
   */
  compare(localVersion: string, remoteVersion: string): VersionComparisonResult;

  /**
   * Convenience predicate. Returns true when remoteVersion is strictly
   * newer than localVersion according to semver precedence rules.
   *
   * Internally delegates to compare() — callers that also need the parsed
   * versions should call compare() directly to avoid parsing twice.
   *
   * @param localVersion  - Version string of the installed KDOS build.
   * @param remoteVersion - Version string from the latest GitHub release.
   * @returns             True when an update is available.
   * @throws              VersionComparatorError when either string cannot be parsed.
   */
  isUpdateAvailable(localVersion: string, remoteVersion: string): boolean;
}