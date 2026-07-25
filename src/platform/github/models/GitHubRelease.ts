/**
 * src/platform/github/models/GitHubRelease.ts
 *
 * Canonical strongly-typed model for a GitHub Release within the KDOS
 * platform layer. This file replaces any previously generated GitHubRelease
 * definition. All other modules must import from this path.
 */

// ---------------------------------------------------------------------------
// Asset model
// ---------------------------------------------------------------------------

export interface GitHubReleaseAsset {
  /** Numeric asset identifier assigned by GitHub. */
  readonly id: number;

  /** File name as it appears on the release (e.g. "kdos-1.2.0-win.exe"). */
  readonly name: string;

  /** MIME type reported by GitHub (e.g. "application/octet-stream"). */
  readonly contentType: string;

  /** File size in bytes. */
  readonly size: number;

  /** Number of times this asset has been downloaded. */
  readonly downloadCount: number;

  /** Direct URL for downloading the asset. No authentication required for public repos. */
  readonly downloadUrl: string;

  /** ISO-8601 UTC timestamp of when the asset was uploaded. */
  readonly createdAt: string;

  /** ISO-8601 UTC timestamp of the most recent asset update. */
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// Release model
// ---------------------------------------------------------------------------

export interface GitHubRelease {
  /** Numeric release identifier assigned by GitHub. */
  readonly id: number;

  /**
   * Git tag name associated with the release (e.g. "v1.2.0").
   * Use this as the authoritative version string before parsing.
   */
  readonly tagName: string;

  /** Human-readable release title. May differ from tagName. */
  readonly name: string;

  /**
   * Release notes in Markdown. Empty string when the release has no body.
   * Never null — normalised during parsing.
   */
  readonly releaseNotes: string;

  /**
   * ISO-8601 UTC timestamp of when the release was published.
   * Null for draft releases that have never been published.
   */
  readonly publishedAt: string | null;

  /** True when this release is marked as a pre-release on GitHub. */
  readonly prerelease: boolean;

  /** True when this release is still in draft state (not yet published). */
  readonly draft: boolean;

  /** URL of the release page on github.com. */
  readonly htmlUrl: string;

  /** All assets attached to this release. Empty array when none are present. */
  readonly assets: GitHubReleaseAsset[];
}

// ---------------------------------------------------------------------------
// Parse errors
// ---------------------------------------------------------------------------

export class GitHubReleaseParseError extends Error {
  public readonly field: string;

  constructor(field: string, reason: string) {
    super(`Failed to parse GitHub release field "${field}": ${reason}`);
    this.name = 'GitHubReleaseParseError';
    this.field = field;
  }
}

// ---------------------------------------------------------------------------
// Internal parse helpers — not exported; used only by the parser below
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireNumber(record: Record<string, unknown>, field: string): number {
  const value = record[field];
  if (typeof value !== 'number') {
    throw new GitHubReleaseParseError(field, `expected number, got ${typeof value}`);
  }
  return value;
}

function requireString(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  if (typeof value !== 'string') {
    throw new GitHubReleaseParseError(field, `expected string, got ${typeof value}`);
  }
  return value;
}

function requireBoolean(record: Record<string, unknown>, field: string): boolean {
  const value = record[field];
  if (typeof value !== 'boolean') {
    throw new GitHubReleaseParseError(field, `expected boolean, got ${typeof value}`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new GitHubReleaseParseError(field, `expected string or null, got ${typeof value}`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Parsers — exported so IGitHubReleaseProvider implementations can use them
// ---------------------------------------------------------------------------

export function parseGitHubReleaseAsset(raw: unknown): GitHubReleaseAsset {
  if (!isRecord(raw)) {
    throw new GitHubReleaseParseError('asset', 'payload is not an object');
  }

  return {
    id:            requireNumber(raw, 'id'),
    name:          requireString(raw, 'name'),
    contentType:   requireString(raw, 'content_type'),
    size:          requireNumber(raw, 'size'),
    downloadCount: requireNumber(raw, 'download_count'),
    downloadUrl:   requireString(raw, 'browser_download_url'),
    createdAt:     requireString(raw, 'created_at'),
    updatedAt:     requireString(raw, 'updated_at'),
  };
}

export function parseGitHubRelease(raw: unknown): GitHubRelease {
  if (!isRecord(raw)) {
    throw new GitHubReleaseParseError('release', 'payload is not an object');
  }

  const rawAssets = raw['assets'];
  if (!Array.isArray(rawAssets)) {
    throw new GitHubReleaseParseError('assets', 'expected array');
  }

  return {
    id:           requireNumber(raw, 'id'),
    tagName:      requireString(raw, 'tag_name'),
    name:         requireString(raw, 'name'),
    releaseNotes: typeof raw['body'] === 'string' ? raw['body'] : '',
    publishedAt:  optionalString(raw, 'published_at'),
    prerelease:   requireBoolean(raw, 'prerelease'),
    draft:        requireBoolean(raw, 'draft'),
    htmlUrl:      requireString(raw, 'html_url'),
    assets:       rawAssets.map(parseGitHubReleaseAsset),
  };
}