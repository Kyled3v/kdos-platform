import { GitHubVersion } from './GitHubVersion';
import {
  GitHubReleaseAsset,
  GitHubVersionManifest,
  GitHubPlatformKey,
  parseGitHubVersionManifest,
} from './GitHubAssets';
import { GitHubRelease, parseGitHubRelease } from './GitHubRelease';

export interface GitHubUpdateProviderConfig {
  readonly owner: string;
  readonly repo: string;
  readonly currentVersion: string;
  readonly userAgent: string;
  readonly token?: string;
  readonly manifestAssetName?: string;
}

export interface UpdateCheckResult {
  readonly updateAvailable: boolean;
  readonly currentVersion: GitHubVersion;
  readonly latestVersion: GitHubVersion;
  readonly release: GitHubRelease;
  readonly manifest: GitHubVersionManifest;
}

export class GitHubUpdateProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'GitHubUpdateProviderError';
  }
}

const DEFAULT_MANIFEST_ASSET_NAME = 'version.json';
const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubUpdateProvider {
  private readonly owner: string;
  private readonly repo: string;
  private readonly currentVersion: GitHubVersion;
  private readonly userAgent: string;
  private readonly token: string | undefined;
  private readonly manifestAssetName: string;

  constructor(config: GitHubUpdateProviderConfig) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.currentVersion = GitHubVersion.parse(config.currentVersion);
    this.userAgent = config.userAgent;
    this.token = config.token;
    this.manifestAssetName = config.manifestAssetName ?? DEFAULT_MANIFEST_ASSET_NAME;
  }

  /**
   * Fetches the latest published (non-draft, non-prerelease) GitHub release,
   * downloads its version manifest, and compares it against the installed version.
   */
  public async checkForUpdate(): Promise<UpdateCheckResult> {
    const release = await this.fetchLatestRelease();
    const manifest = await this.fetchVersionManifest(release);
    const latestVersion = GitHubVersion.parse(manifest.version);

    return {
      updateAvailable: latestVersion.isNewerThan(this.currentVersion),
      currentVersion: this.currentVersion,
      latestVersion,
      release,
      manifest,
    };
  }

  /**
   * Resolves the downloadable release asset for a given platform, using the
   * file name declared in the version manifest.
   */
  public resolvePlatformAsset(
    release: GitHubRelease,
    manifest: GitHubVersionManifest,
    platform: GitHubPlatformKey
  ): GitHubReleaseAsset {
    const assetName = manifest.assets[platform];
    if (assetName === undefined) {
      throw new GitHubUpdateProviderError(
        `Version manifest does not declare an asset for platform "${platform}"`
      );
    }

    const asset = release.assets.find((candidate) => candidate.name === assetName);
    if (asset === undefined) {
      throw new GitHubUpdateProviderError(
        `Release "${release.tagName}" does not contain declared asset "${assetName}"`
      );
    }

    return asset;
  }

  private async fetchLatestRelease(): Promise<GitHubRelease> {
    const url = `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/releases/latest`;
    const response = await fetch(url, { headers: this.buildHeaders('application/vnd.github+json') });

    if (!response.ok) {
      throw new GitHubUpdateProviderError(
        `GitHub API request failed with status ${response.status} ${response.statusText} for ${url}`
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new GitHubUpdateProviderError('Failed to parse GitHub release response as JSON', error);
    }

    try {
      return parseGitHubRelease(payload);
    } catch (error) {
      throw new GitHubUpdateProviderError('Failed to parse GitHub release payload', error);
    }
  }

  private async fetchVersionManifest(release: GitHubRelease): Promise<GitHubVersionManifest> {
    const manifestAsset = release.assets.find((asset) => asset.name === this.manifestAssetName);

    if (manifestAsset === undefined) {
      throw new GitHubUpdateProviderError(
        `Release "${release.tagName}" does not contain a "${this.manifestAssetName}" asset`
      );
    }

    const response = await fetch(manifestAsset.downloadUrl, {
      headers: this.buildHeaders('application/octet-stream'),
    });

    if (!response.ok) {
      throw new GitHubUpdateProviderError(
        `Failed to download "${this.manifestAssetName}" with status ${response.status} ${response.statusText}`
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new GitHubUpdateProviderError(`Failed to parse "${this.manifestAssetName}" as JSON`, error);
    }

    try {
      return parseGitHubVersionManifest(payload);
    } catch (error) {
      throw new GitHubUpdateProviderError(`Failed to parse "${this.manifestAssetName}" contents`, error);
    }
  }

  private buildHeaders(accept: string): HeadersInit {
    const headers: Record<string, string> = {
      Accept: accept,
      'User-Agent': this.userAgent,
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token !== undefined) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }
}