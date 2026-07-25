/**
 * src/platform/github/contracts/IGitHubReleaseProvider.ts
 *
 * Production contract for GitHub release data retrieval within the KDOS
 * platform layer.
 *
 * Consumed by UpdateService, UpdatePipeline, and any other internal component
 * that needs release metadata. No caller beneath this interface touches the
 * GitHub REST API directly.
 */

import type { GitHubRelease } from '../models/GitHubRelease';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface GitHubReleaseProviderConfig {
  /**
   * GitHub account or organisation that owns the repository.
   * Example: "KyleDev"
   */
  readonly owner: string;

  /**
   * Repository name within the owner account.
   * Example: "kdos"
   */
  readonly repo: string;

  /**
   * Value sent as the User-Agent HTTP header on every request.
   * GitHub requires a non-empty User-Agent for all API calls.
   * Example: "KDOS/1.0.0"
   */
  readonly userAgent: string;

  /**
   * Optional GitHub Personal Access Token or installation token.
   * Required for private repositories; recommended for private rate-limit
   * headroom on public repositories.
   * When undefined, requests are made without authentication (60 req/h limit).
   */
  readonly token?: string;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class GitHubReleaseProviderError extends Error {
  /** HTTP status code when the failure originated from the GitHub API. */
  public readonly statusCode: number | null;
  public readonly cause: unknown;

  constructor(message: string, options: { statusCode?: number; cause?: unknown } = {}) {
    super(message);
    this.name = 'GitHubReleaseProviderError';
    this.statusCode = options.statusCode ?? null;
    this.cause = options.cause;
  }
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IGitHubReleaseProvider {
  /**
   * Retrieves the latest published GitHub release for the configured
   * repository.
   *
   * "Latest" follows GitHub's own definition: the most recent non-draft,
   * non-prerelease release, ordered by published_at descending.
   *
   * The returned object is strongly typed as GitHubRelease and includes
   * the version (tagName), release notes (releaseNotes), published date
   * (publishedAt), and all attached assets with their download URLs.
   *
   * @returns  A fully populated GitHubRelease.
   * @throws   GitHubReleaseProviderError when the API is unreachable,
   *           returns a non-success status, or the payload cannot be parsed.
   */
  getLatestRelease(): Promise<GitHubRelease>;
}