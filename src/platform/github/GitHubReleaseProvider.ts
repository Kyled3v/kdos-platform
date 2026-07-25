/**
 * src/platform/github/GitHubReleaseProvider.ts
 *
 * Production implementation of IGitHubReleaseProvider.
 *
 * Retrieves release metadata from the GitHub REST API v3.
 * Dependency-injection ready: accept IGitHubReleaseProvider wherever
 * the interface is declared; bind this class in the composition root.
 *
 * No Electron code. No installer code. No UI. Pure HTTP + parsing.
 */

import {
  GitHubReleaseProviderError,
  IGitHubReleaseProvider,
  GitHubReleaseProviderConfig,
} from './contracts/IGitHubReleaseProvider';

import {
  GitHubRelease,
  GitHubReleaseParseError,
  parseGitHubRelease,
} from './models/GitHubRelease';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json';

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class GitHubReleaseProvider implements IGitHubReleaseProvider {
  private readonly owner: string;
  private readonly repo: string;
  private readonly userAgent: string;
  private readonly token: string | undefined;

  constructor(config: GitHubReleaseProviderConfig) {
    if (config.owner.trim().length === 0) {
      throw new Error('GitHubReleaseProvider: owner must not be empty');
    }
    if (config.repo.trim().length === 0) {
      throw new Error('GitHubReleaseProvider: repo must not be empty');
    }
    if (config.userAgent.trim().length === 0) {
      throw new Error('GitHubReleaseProvider: userAgent must not be empty');
    }

    this.owner     = config.owner.trim();
    this.repo      = config.repo.trim();
    this.userAgent = config.userAgent.trim();
    this.token     = config.token;
  }

  /**
   * Retrieves the latest published release from the GitHub REST API.
   *
   * Endpoint: GET /repos/{owner}/{repo}/releases/latest
   * Docs: https://docs.github.com/en/rest/releases/releases#get-the-latest-release
   */
  public async getLatestRelease(): Promise<GitHubRelease> {
    const url = `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/releases/latest`;

    const response = await this.request(url);
    const payload  = await this.parseJsonBody(response, url);

    try {
      return parseGitHubRelease(payload);
    } catch (error) {
      if (error instanceof GitHubReleaseParseError) {
        throw new GitHubReleaseProviderError(
          `GitHub release payload from "${url}" failed validation: ${error.message}`,
          { cause: error }
        );
      }
      throw new GitHubReleaseProviderError(
        `Unexpected error parsing GitHub release from "${url}"`,
        { cause: error }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async request(url: string): Promise<Response> {
    const headers = this.buildHeaders();

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch (error) {
      throw new GitHubReleaseProviderError(
        `Network request to "${url}" failed`,
        { cause: error }
      );
    }

    if (!response.ok) {
      throw new GitHubReleaseProviderError(
        `GitHub API returned status ${response.status} ${response.statusText} for "${url}"`,
        { statusCode: response.status }
      );
    }

    return response;
  }

  private async parseJsonBody(response: Response, url: string): Promise<unknown> {
    try {
      return await response.json() as unknown;
    } catch (error) {
      throw new GitHubReleaseProviderError(
        `Failed to parse JSON response body from "${url}"`,
        { cause: error }
      );
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept':               GITHUB_ACCEPT_HEADER,
      'User-Agent':           this.userAgent,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    };

    if (this.token !== undefined) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }
}