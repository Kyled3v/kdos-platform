/**
 * VersionComparator
 *
 * Compares semantic versions.
 */

export type VersionComparisonResult = "Newer" | "Older" | "Equal";

export interface ParsedVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: string | undefined;
}

const SEMANTIC_VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export class VersionComparator {
  public compare(left: string, right: string): VersionComparisonResult {
    const parsedLeft = this.parse(left);
    const parsedRight = this.parse(right);

    if (parsedLeft.major !== parsedRight.major) {
      return parsedLeft.major > parsedRight.major ? "Newer" : "Older";
    }

    if (parsedLeft.minor !== parsedRight.minor) {
      return parsedLeft.minor > parsedRight.minor ? "Newer" : "Older";
    }

    if (parsedLeft.patch !== parsedRight.patch) {
      return parsedLeft.patch > parsedRight.patch ? "Newer" : "Older";
    }

    return this.comparePrerelease(parsedLeft.prerelease, parsedRight.prerelease);
  }

  public isNewer(left: string, right: string): boolean {
    return this.compare(left, right) === "Newer";
  }

  public isOlder(left: string, right: string): boolean {
    return this.compare(left, right) === "Older";
  }

  public isEqual(left: string, right: string): boolean {
    return this.compare(left, right) === "Equal";
  }

  private parse(version: string): ParsedVersion {
    const match = SEMANTIC_VERSION_PATTERN.exec(version.trim());

    if (match === null) {
      throw new Error(`Invalid semantic version string: ${version}`);
    }

    const [, majorText, minorText, patchText, prerelease] = match;

    return {
      major: Number(majorText),
      minor: Number(minorText),
      patch: Number(patchText),
      prerelease,
    };
  }

  private comparePrerelease(
    left: string | undefined,
    right: string | undefined
  ): VersionComparisonResult {
    if (left === undefined && right === undefined) {
      return "Equal";
    }

    if (left === undefined) {
      return "Newer";
    }

    if (right === undefined) {
      return "Older";
    }

    if (left === right) {
      return "Equal";
    }

    return left > right ? "Newer" : "Older";
  }
}