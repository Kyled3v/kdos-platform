/**
 * VersionManager.ts
 *
 * Location: src/platform/updates/VersionManager.ts
 *
 * Tracks the running application's own version and build number,
 * whether an update is known to be available, and provides version
 * comparison. This file contains no networking, no update-checking
 * API calls, and no download logic - it is the architecture that a
 * future networked update checker will report its findings into via
 * `setUpdateAvailable`, and that the rest of KDOS reads version
 * information from.
 */

/**
 * A single semantic version, decomposed into its three numeric
 * components.
 */
export interface ParsedVersion {
  readonly major: number
  readonly minor: number
  readonly patch: number
}

/**
 * An immutable snapshot of everything VersionManager currently knows.
 */
export interface VersionSnapshot {
  readonly currentVersion: string
  readonly buildNumber: string
  readonly updateAvailable: boolean
}

/**
 * Thrown when a version string cannot be parsed as MAJOR.MINOR.PATCH.
 */
export class InvalidVersionError extends Error {
  public constructor(version: string) {
    super(`VersionManager: "${version}" is not a valid MAJOR.MINOR.PATCH version string.`)
    this.name = 'InvalidVersionError'
  }
}

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/

/**
 * VersionManager
 *
 * Single responsibility: hold the running application's current
 * version and build number, track whether an update has been
 * reported as available, and compare version strings.
 *
 * This class:
 *   - Performs no networking, no update-check API calls, and no
 *     download logic - `updateAvailable` is only ever changed via
 *     `setUpdateAvailable`, called by whatever future component
 *     actually performs an update check.
 *   - Never mutates `currentVersion` or `buildNumber` after
 *     construction - those identify the build actually running.
 */
export class VersionManager {
  private readonly currentVersion: string
  private readonly buildNumber: string
  private updateAvailable: boolean

  /**
   * @param currentVersion - The running application's version, as
   *        MAJOR.MINOR.PATCH.
   * @param buildNumber - The running application's build identifier.
   * @param updateAvailable - Whether an update is already known to be
   *        available at construction time. Defaults to false.
   */
  public constructor(currentVersion: string, buildNumber: string, updateAvailable = false) {
    VersionManager.parseVersion(currentVersion)
    this.currentVersion = currentVersion
    this.buildNumber = buildNumber
    this.updateAvailable = updateAvailable
  }

  /**
   * Returns the running application's version string.
   */
  public getCurrentVersion(): string {
    return this.currentVersion
  }

  /**
   * Returns the running application's build number.
   */
  public getBuildNumber(): string {
    return this.buildNumber
  }

  /**
   * Returns whether an update has been reported as available.
   */
  public isUpdateAvailable(): boolean {
    return this.updateAvailable
  }

  /**
   * Records whether an update is available. This is the only way
   * `updateAvailable` ever changes - VersionManager itself never
   * determines this on its own, since that would require networking
   * this class deliberately does not perform.
   *
   * @param available - The new update-availability state.
   */
  public setUpdateAvailable(available: boolean): void {
    this.updateAvailable = available
  }

  /**
   * Returns an immutable snapshot of everything this manager
   * currently knows.
   */
  public getSnapshot(): VersionSnapshot {
    return {
      currentVersion: this.currentVersion,
      buildNumber: this.buildNumber,
      updateAvailable: this.updateAvailable,
    }
  }

  /**
   * Compares two MAJOR.MINOR.PATCH version strings.
   *
   * @param a - The first version to compare.
   * @param b - The second version to compare.
   * @returns A negative number if `a` is lower than `b`, a positive
   *          number if `a` is higher than `b`, or zero if they are
   *          equal.
   * @throws InvalidVersionError if either string is not a valid
   *         MAJOR.MINOR.PATCH version.
   */
  public static compareVersions(a: string, b: string): number {
    const parsedA = VersionManager.parseVersion(a)
    const parsedB = VersionManager.parseVersion(b)

    if (parsedA.major !== parsedB.major) {
      return parsedA.major - parsedB.major
    }
    if (parsedA.minor !== parsedB.minor) {
      return parsedA.minor - parsedB.minor
    }
    return parsedA.patch - parsedB.patch
  }

  /**
   * Parses a MAJOR.MINOR.PATCH version string into its numeric parts.
   *
   * @throws InvalidVersionError if the string does not match
   *         MAJOR.MINOR.PATCH.
   */
  private static parseVersion(version: string): ParsedVersion {
    const match = VERSION_PATTERN.exec(version.trim())
    if (!match) {
      throw new InvalidVersionError(version)
    }

    return {
      major: Number.parseInt(match[1], 10),
      minor: Number.parseInt(match[2], 10),
      patch: Number.parseInt(match[3], 10),
    }
  }
}
