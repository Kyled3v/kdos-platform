/**
 * Strongly typed models for GitHub release assets and the KDOS version manifest
 * (version.json) that is published alongside each GitHub release.
 */

export interface GitHubReleaseAsset {
  readonly id: number;
  readonly name: string;
  readonly label: string | null;
  readonly contentType: string;
  readonly size: number;
  readonly downloadCount: number;
  readonly downloadUrl: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type GitHubPlatformKey = 'win' | 'mac' | 'linux';

export interface GitHubVersionManifestAssets {
  readonly win?: string;
  readonly mac?: string;
  readonly linux?: string;
}

export interface GitHubVersionManifestChecksums {
  readonly win?: string;
  readonly mac?: string;
  readonly linux?: string;
}

export interface GitHubVersionManifest {
  readonly version: string;
  readonly releaseDate: string;
  readonly notes: string;
  readonly assets: GitHubVersionManifestAssets;
  readonly sha512: GitHubVersionManifestChecksums;
}

export class GitHubAssetParseError extends Error {
  constructor(reason: string) {
    super(`Failed to parse GitHub release asset: ${reason}`);
    this.name = 'GitHubAssetParseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new GitHubAssetParseError(`Field "${key}" must be a string`);
  }
  return value;
}

function requireNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number') {
    throw new GitHubAssetParseError(`Field "${key}" must be a number`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new GitHubAssetParseError(`Field "${key}" must be a string when present`);
  }
  return value;
}

export function parseGitHubReleaseAsset(raw: unknown): GitHubReleaseAsset {
  if (!isRecord(raw)) {
    throw new GitHubAssetParseError('Asset payload is not an object');
  }

  return {
    id: requireNumber(raw, 'id'),
    name: requireString(raw, 'name'),
    label: optionalString(raw, 'label'),
    contentType: requireString(raw, 'content_type'),
    size: requireNumber(raw, 'size'),
    downloadCount: requireNumber(raw, 'download_count'),
    downloadUrl: requireString(raw, 'browser_download_url'),
    createdAt: requireString(raw, 'created_at'),
    updatedAt: requireString(raw, 'updated_at'),
  };
}

export function parseGitHubReleaseAssets(raw: unknown): GitHubReleaseAsset[] {
  if (!Array.isArray(raw)) {
    throw new GitHubAssetParseError('Assets payload is not an array');
  }
  return raw.map(parseGitHubReleaseAsset);
}

const PLATFORM_KEYS: readonly GitHubPlatformKey[] = ['win', 'mac', 'linux'];

function parsePlatformStringMap(
  record: Record<string, unknown>,
  key: string
): Record<GitHubPlatformKey, string | undefined> {
  const value = record[key];
  const result: Record<GitHubPlatformKey, string | undefined> = {
    win: undefined,
    mac: undefined,
    linux: undefined,
  };

  if (value === undefined || value === null) {
    return result;
  }

  if (!isRecord(value)) {
    throw new GitHubAssetParseError(`Field "${key}" must be an object when present`);
  }

  for (const platform of PLATFORM_KEYS) {
    const entry = value[platform];
    if (entry === undefined) continue;
    if (typeof entry !== 'string') {
      throw new GitHubAssetParseError(`Field "${key}.${platform}" must be a string`);
    }
    result[platform] = entry;
  }

  return result;
}

export function parseGitHubVersionManifest(raw: unknown): GitHubVersionManifest {
  if (!isRecord(raw)) {
    throw new GitHubAssetParseError('Version manifest payload is not an object');
  }

  const assets = parsePlatformStringMap(raw, 'assets');
  const sha512 = parsePlatformStringMap(raw, 'sha512');

  return {
    version: requireString(raw, 'version'),
    releaseDate: requireString(raw, 'releaseDate'),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    assets: {
      win: assets.win,
      mac: assets.mac,
      linux: assets.linux,
    },
    sha512: {
      win: sha512.win,
      mac: sha512.mac,
      linux: sha512.linux,
    },
  };
}