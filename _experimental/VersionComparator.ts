/**
 * VersionComparator
 *
 * Compares semantic versions following the SemVer 2.0.0 specification.
 * Handles major, minor, patch, and pre-release segments.
 */

export type VersionComparisonResult = "Newer" | "Older" | "Equal";

export interface ParsedVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: string | undefined;
}

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function parseVersion(version: string): ParsedVersion {
  const match = SEMVER_PATTERN.exec(version.trim());

  if (match === null) {
    throw new Error(`Invalid semantic version string: "${version}"`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

function comparePrerelease(
  left: string | undefined,
  right: string | undefined
): VersionComparisonResult {
  if (left === undefined && right === undefined) return "Equal";
  if (left === undefined) return "Newer";
  if (right === undefined) return "Older";
  if (left === right) return "Equal";
  return left > right ? "Newer" : "Older";
}

export class VersionComparator {
  public compare(left: string, right: string): VersionComparisonResult {
    const l = parseVersion(left);
    const r = parseVersion(right);

    if (l.major !== r.major) return l.major > r.major ? "Newer" : "Older";
    if (l.minor !== r.minor) return l.minor > r.minor ? "Newer" : "Older";
    if (l.patch !== r.patch) return l.patch > r.patch ? "Newer" : "Older";

    return comparePrerelease(l.prerelease, r.prerelease);
  }

  public isNewer(candidate: string, baseline: string): boolean {
    return this.compare(candidate, baseline) === "Newer";
  }

  public isOlder(candidate: string, baseline: string): boolean {
    return this.compare(candidate, baseline) === "Older";
  }

  public isEqual(left: string, right: string): boolean {
    return this.compare(left, right) === "Equal";
  }
}