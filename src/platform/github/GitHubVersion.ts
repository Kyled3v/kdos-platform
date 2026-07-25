/**
 * Strongly typed semantic version model for KDOS GitHub releases.
 * Parses and compares version strings in the form MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD].
 */

export class GitHubVersionParseError extends Error {
  constructor(raw: string) {
    super(`Invalid version string: "${raw}"`);
    this.name = 'GitHubVersionParseError';
  }
}

const VERSION_PATTERN =
  /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/;

export class GitHubVersion {
  public readonly major: number;
  public readonly minor: number;
  public readonly patch: number;
  public readonly prerelease: string | null;
  public readonly build: string | null;
  public readonly raw: string;

  private constructor(
    major: number,
    minor: number,
    patch: number,
    prerelease: string | null,
    build: string | null,
    raw: string
  ) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.prerelease = prerelease;
    this.build = build;
    this.raw = raw;
  }

  public static parse(raw: string): GitHubVersion {
    const match = VERSION_PATTERN.exec(raw.trim());
    if (!match) {
      throw new GitHubVersionParseError(raw);
    }

    const [, majorStr, minorStr, patchStr, prerelease, build] = match;

    return new GitHubVersion(
      Number.parseInt(majorStr, 10),
      Number.parseInt(minorStr, 10),
      Number.parseInt(patchStr, 10),
      prerelease ?? null,
      build ?? null,
      raw
    );
  }

  public static tryParse(raw: string): GitHubVersion | null {
    try {
      return GitHubVersion.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Compares this version to another.
   * Returns a negative number if this < other, 0 if equal, positive if this > other.
   * Follows semver precedence rules: prerelease versions have lower precedence
   * than the associated normal version. Build metadata is ignored in comparison.
   */
  public compareTo(other: GitHubVersion): number {
    if (this.major !== other.major) return this.major - other.major;
    if (this.minor !== other.minor) return this.minor - other.minor;
    if (this.patch !== other.patch) return this.patch - other.patch;

    if (this.prerelease === null && other.prerelease === null) return 0;
    if (this.prerelease === null) return 1;
    if (other.prerelease === null) return -1;

    return GitHubVersion.comparePrerelease(this.prerelease, other.prerelease);
  }

  public isNewerThan(other: GitHubVersion): boolean {
    return this.compareTo(other) > 0;
  }

  public isOlderThan(other: GitHubVersion): boolean {
    return this.compareTo(other) < 0;
  }

  public equals(other: GitHubVersion): boolean {
    return this.compareTo(other) === 0;
  }

  public toString(): string {
    let result = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease !== null) result += `-${this.prerelease}`;
    if (this.build !== null) result += `+${this.build}`;
    return result;
  }

  private static comparePrerelease(a: string, b: string): number {
    const aParts = a.split('.');
    const bParts = b.split('.');
    const length = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < length; i += 1) {
      const aPart = aParts[i];
      const bPart = bParts[i];

      if (aPart === undefined) return -1;
      if (bPart === undefined) return 1;

      const aNum = Number.parseInt(aPart, 10);
      const bNum = Number.parseInt(bPart, 10);
      const aIsNum = /^\d+$/.test(aPart);
      const bIsNum = /^\d+$/.test(bPart);

      if (aIsNum && bIsNum) {
        if (aNum !== bNum) return aNum - bNum;
        continue;
      }

      if (aIsNum && !bIsNum) return -1;
      if (!aIsNum && bIsNum) return 1;

      const compared = aPart.localeCompare(bPart);
      if (compared !== 0) return compared;
    }

    return 0;
  }
}