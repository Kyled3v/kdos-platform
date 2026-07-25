/**
 * src/platform/update/version/VersionComparator.ts
 *
 * Production implementation of IVersionComparator.
 *
 * Stateless and side-effect free. Safe to use as a singleton in the
 * composition root and inject wherever IVersionComparator is declared.
 *
 * No UI. No Electron. No GitHub API. Pure version comparison.
 */

import {
  IVersionComparator,
  VersionComparisonResult,
  VersionComparatorError,
  VersionOrder,
} from './IVersionComparator';

import {
  SemanticVersion,
  SemanticVersionParseError,
} from './SemanticVersion';

export class VersionComparator implements IVersionComparator {
  /**
   * Parses both version strings and compares them using full semver 2.0.0
   * precedence rules (major → minor → patch → prerelease).
   * Build metadata is ignored in all comparisons.
   */
  public compare(localVersion: string, remoteVersion: string): VersionComparisonResult {
    const local  = this.parse(localVersion,  'localVersion');
    const remote = this.parse(remoteVersion, 'remoteVersion');

    const raw:   number     = local.compareTo(remote);
    const order: VersionOrder =
      raw < 0 ? -1 :
      raw > 0 ?  1 :
                  0;

    return {
      order,
      updateAvailable: order === -1,
      localVersion:    local,
      remoteVersion:   remote,
    };
  }

  /**
   * Returns true when remoteVersion is strictly newer than localVersion.
   * Delegates to compare() — the full result is discarded after the check.
   */
  public isUpdateAvailable(localVersion: string, remoteVersion: string): boolean {
    return this.compare(localVersion, remoteVersion).updateAvailable;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private parse(raw: string, label: string): SemanticVersion {
    try {
      return SemanticVersion.parse(raw);
    } catch (error) {
      if (error instanceof SemanticVersionParseError) {
        throw new VersionComparatorError(
          `${label} "${raw}" is not a valid semantic version: ${error.message}`,
          error,
        );
      }
      throw new VersionComparatorError(
        `Unexpected error parsing ${label} "${raw}"`,
        error,
      );
    }
  }
}