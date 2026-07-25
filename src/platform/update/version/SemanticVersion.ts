/**
 * src/platform/update/version/SemanticVersion.ts
 *
 * Canonical semantic version model for KDOS.
 * Replaces the earlier GitHubVersion.ts — all modules must import from this path.
 *
 * Implements full semver 2.0.0 precedence rules:
 *   https://semver.org/#spec-item-11
 *
 * Accepted formats
 *   MAJOR.MINOR.PATCH
 *   MAJOR.MINOR.PATCH-PRERELEASE
 *   MAJOR.MINOR.PATCH-PRERELEASE+BUILD
 *   MAJOR.MINOR.PATCH+BUILD
 *   Leading "v" or "V" is stripped before parsing.
 */

const SEMVER_PATTERN =
  /^[vV]?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class SemanticVersionParseError extends Error {
  public readonly raw: string;

  constructor(raw: string) {
    super(
      `"${raw}" is not a valid semantic version. ` +
      `Expected MAJOR.MINOR.PATCH with optional -prerelease and/or +build.`
    );
    this.name = 'SemanticVersionParseError';
    this.raw  = raw;
  }
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export class SemanticVersion {
  public readonly major:      number;
  public readonly minor:      number;
  public readonly patch:      number;
  /** Dot-separated prerelease identifier string, or null when absent. */
  public readonly prerelease: string | null;
  /** Dot-separated build metadata string, or null when absent. Build metadata
   *  is ignored during precedence comparison per semver 2.0.0 §10. */
  public readonly build:      string | null;
  /** The original string passed to parse(), preserved for display. */
  public readonly raw:        string;

  private constructor(
    major:      number,
    minor:      number,
    patch:      number,
    prerelease: string | null,
    build:      string | null,
    raw:        string,
  ) {
    this.major      = major;
    this.minor      = minor;
    this.patch      = patch;
    this.prerelease = prerelease;
    this.build      = build;
    this.raw        = raw;
  }

  // ---------------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------------

  /**
   * Parses a version string into a SemanticVersion.
   *
   * @param raw - Version string, optionally prefixed with "v" or "V".
   * @throws SemanticVersionParseError when the string does not conform.
   */
  public static parse(raw: string): SemanticVersion {
    const trimmed = raw.trim();
    const match   = SEMVER_PATTERN.exec(trimmed);

    if (match === null) {
      throw new SemanticVersionParseError(raw);
    }

    const [, majorStr, minorStr, patchStr, prerelease, build] = match;

    return new SemanticVersion(
      Number.parseInt(majorStr, 10),
      Number.parseInt(minorStr, 10),
      Number.parseInt(patchStr, 10),
      prerelease ?? null,
      build      ?? null,
      raw,
    );
  }

  /**
   * Attempts to parse a version string.
   * Returns null instead of throwing when the string does not conform.
   *
   * @param raw - Version string to attempt parsing.
   */
  public static tryParse(raw: string): SemanticVersion | null {
    try {
      return SemanticVersion.parse(raw);
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Comparison
  // ---------------------------------------------------------------------------

  /**
   * Compares this version to another following semver 2.0.0 precedence rules.
   *
   * Returns
   *   negative when this < other
   *   0        when this === other
   *   positive when this > other
   *
   * Build metadata is ignored in all comparisons per semver §10.
   */
  public compareTo(other: SemanticVersion): number {
    // 1. Compare numeric identifiers left to right.
    if (this.major !== other.major) return this.major - other.major;
    if (this.minor !== other.minor) return this.minor - other.minor;
    if (this.patch !== other.patch) return this.patch - other.patch;

    // 2. A normal version has higher precedence than its prerelease (semver §11.3).
    if (this.prerelease === null && other.prerelease === null) return 0;
    if (this.prerelease === null)  return  1;
    if (other.prerelease === null) return -1;

    // 3. Compare prerelease identifiers dot by dot (semver §11.4).
    return SemanticVersion.comparePrerelease(this.prerelease, other.prerelease);
  }

  /** Returns true when this version is strictly newer than other. */
  public isNewerThan(other: SemanticVersion): boolean {
    return this.compareTo(other) > 0;
  }

  /** Returns true when this version is strictly older than other. */
  public isOlderThan(other: SemanticVersion): boolean {
    return this.compareTo(other) < 0;
  }

  /** Returns true when this version has the same precedence as other.
   *  Build metadata differences do not affect equality. */
  public equals(other: SemanticVersion): boolean {
    return this.compareTo(other) === 0;
  }

  // ---------------------------------------------------------------------------
  // Serialisation
  // ---------------------------------------------------------------------------

  /**
   * Returns a canonical version string without leading "v".
   * Example: "2.1.3-beta.1+build.42" → "2.1.3-beta.1+build.42"
   */
  public toString(): string {
    let result = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease !== null) result += `-${this.prerelease}`;
    if (this.build      !== null) result += `+${this.build}`;
    return result;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Compares two prerelease strings identifier by identifier per semver §11.4.
   *
   * Rules per identifier:
   *   - Identifiers consisting of only digits are compared numerically.
   *   - Identifiers with letters or hyphens are compared lexically (ASCII order).
   *   - Numeric identifiers have lower precedence than alphanumeric identifiers.
   *   - A larger set of fields has higher precedence than a smaller set,
   *     when all preceding fields are equal.
   */
  private static comparePrerelease(a: string, b: string): number {
    const aParts = a.split('.');
    const bParts = b.split('.');
    const length = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < length; i += 1) {
      const aPart = aParts[i];
      const bPart = bParts[i];

      // Fewer fields loses (semver §11.4.4).
      if (aPart === undefined) return -1;
      if (bPart === undefined) return  1;

      const aIsNumeric = /^\d+$/.test(aPart);
      const bIsNumeric = /^\d+$/.test(bPart);

      if (aIsNumeric && bIsNumeric) {
        // Both numeric: compare as integers (semver §11.4.1).
        const diff = Number.parseInt(aPart, 10) - Number.parseInt(bPart, 10);
        if (diff !== 0) return diff;
        continue;
      }

      // Numeric < alphanumeric (semver §11.4.3).
      if (aIsNumeric && !bIsNumeric) return -1;
      if (!aIsNumeric && bIsNumeric) return  1;

      // Both alphanumeric: lexical ASCII comparison (semver §11.4.2).
      const lexical = aPart.localeCompare(bPart, 'en', { sensitivity: 'variant' });
      if (lexical !== 0) return lexical;
    }

    return 0;
  }
}