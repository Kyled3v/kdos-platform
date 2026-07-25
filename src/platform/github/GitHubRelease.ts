import { GitHubReleaseAsset, parseGitHubReleaseAssets } from './GitHubAssets';

export interface GitHubRelease {
  readonly id: number;
  readonly tagName: string;
  readonly name: string;
  readonly body: string;
  readonly draft: boolean;
  readonly prerelease: boolean;
  readonly publishedAt: string | null;
  readonly htmlUrl: string;
  readonly assets: GitHubReleaseAsset[];
}

export class GitHubReleaseParseError extends Error {
  constructor(reason: string) {
    super(`Failed to parse GitHub release: ${reason}`);
    this.name = 'GitHubReleaseParseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new GitHubReleaseParseError(`Field "${key}" must be a string`);
  }
  return value;
}

function requireNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number') {
    throw new GitHubReleaseParseError(`Field "${key}" must be a number`);
  }
  return value;
}

function requireBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') {
    throw new GitHubReleaseParseError(`Field "${key}" must be a boolean`);
  }
  return value;
}

export function parseGitHubRelease(raw: unknown): GitHubRelease {
  if (!isRecord(raw)) {
    throw new GitHubReleaseParseError('Release payload is not an object');
  }

  const publishedAt = raw.published_at;
  if (publishedAt !== null && typeof publishedAt !== 'string') {
    throw new GitHubReleaseParseError('Field "published_at" must be a string or null');
  }

  return {
    id: requireNumber(raw, 'id'),
    tagName: requireString(raw, 'tag_name'),
    name: requireString(raw, 'name'),
    body: typeof raw.body === 'string' ? raw.body : '',
    draft: requireBoolean(raw, 'draft'),
    prerelease: requireBoolean(raw, 'prerelease'),
    publishedAt,
    htmlUrl: requireString(raw, 'html_url'),
    assets: parseGitHubReleaseAssets(raw.assets),
  };
}