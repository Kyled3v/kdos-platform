import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Which segment of a semantic version to increment.
 */
export type SemanticVersionSegment = "major" | "minor" | "patch";

/**
 * Outcome of a single version bump operation.
 */
export interface VersionBumpResult {
  readonly previousVersion: string;
  readonly nextVersion: string;
  readonly buildNumber: string;
}

interface PackageJsonShape {
  readonly version: string;
  readonly [key: string]: unknown;
}

const PACKAGE_JSON_PATH = resolve(process.cwd(), "package.json");

/**
 * Reads, increments, and writes the KDOS application version stored in
 * `package.json`, and generates the build number accompanying each
 * release.
 */
export class VersionBumper {
  readVersion(): string {
    return this.readPackageJson().version;
  }

  incrementSemanticVersion(currentVersion: string, segment: SemanticVersionSegment): string {
    const parts = currentVersion.split(".").map((part) => Number.parseInt(part, 10));
    const [major, minor, patch] = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];

    if (segment === "major") {
      return `${major + 1}.0.0`;
    }

    if (segment === "minor") {
      return `${major}.${minor + 1}.0`;
    }

    return `${major}.${minor}.${patch + 1}`;
  }

  generateBuildNumber(): string {
    const now = new Date();
    const pad = (value: number): string => value.toString().padStart(2, "0");

    return (
      `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
      `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
    );
  }

  writeVersion(nextVersion: string): void {
    const packageJson = this.readPackageJson();
    const updated = { ...packageJson, version: nextVersion };

    writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(updated, null, 2)}\n`, "utf-8");
  }

  bump(segment: SemanticVersionSegment): VersionBumpResult {
    const previousVersion = this.readVersion();
    const nextVersion = this.incrementSemanticVersion(previousVersion, segment);
    const buildNumber = this.generateBuildNumber();

    this.writeVersion(nextVersion);

    return { previousVersion, nextVersion, buildNumber };
  }

  private readPackageJson(): PackageJsonShape {
    const raw = readFileSync(PACKAGE_JSON_PATH, "utf-8");
    return JSON.parse(raw) as PackageJsonShape;
  }
}