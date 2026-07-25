/**
 * GitHubManifest
 *
 * Strongly typed representation of the version.json manifest published
 * alongside each KDOS GitHub release.
 */

export interface GitHubManifest {
  readonly version: string;
  readonly buildNumber: string;
  readonly releaseDate: Date;
  readonly minimumVersion: string;
  readonly packageName: string;
  readonly packageSize: number;
  readonly sha256: string;
  readonly releaseNotes: string;
}

interface SerializedGitHubManifest {
  readonly version: string;
  readonly buildNumber: string;
  readonly releaseDate: string;
  readonly minimumVersion: string;
  readonly packageName: string;
  readonly packageSize: number;
  readonly sha256: string;
  readonly releaseNotes: string;
}

export function parseGitHubManifest(json: string): GitHubManifest {
  const parsed = JSON.parse(json) as SerializedGitHubManifest;

  if (
    typeof parsed.version !== "string" ||
    typeof parsed.buildNumber !== "string" ||
    typeof parsed.releaseDate !== "string" ||
    typeof parsed.minimumVersion !== "string" ||
    typeof parsed.packageName !== "string" ||
    typeof parsed.packageSize !== "number" ||
    typeof parsed.sha256 !== "string" ||
    typeof parsed.releaseNotes !== "string"
  ) {
    throw new Error("version.json is missing required fields or contains invalid types.");
  }

  const releaseDate = new Date(parsed.releaseDate);

  if (isNaN(releaseDate.getTime())) {
    throw new Error(`version.json contains an invalid releaseDate: ${parsed.releaseDate}`);
  }

  return {
    version: parsed.version,
    buildNumber: parsed.buildNumber,
    releaseDate,
    minimumVersion: parsed.minimumVersion,
    packageName: parsed.packageName,
    packageSize: parsed.packageSize,
    sha256: parsed.sha256,
    releaseNotes: parsed.releaseNotes,
  };
}

export function serializeGitHubManifest(manifest: GitHubManifest): string {
  const serializable: SerializedGitHubManifest = {
    version: manifest.version,
    buildNumber: manifest.buildNumber,
    releaseDate: manifest.releaseDate.toISOString(),
    minimumVersion: manifest.minimumVersion,
    packageName: manifest.packageName,
    packageSize: manifest.packageSize,
    sha256: manifest.sha256,
    releaseNotes: manifest.releaseNotes,
  };

  return JSON.stringify(serializable, null, 2);
}