/**
 * src/platform/update/manifest/IUpdateManifest.ts
 *
 * Canonical contract for the KDOS update manifest.
 *
 * One UpdateManifest represents one release of KDOS as seen by the
 * update pipeline. It is the single data structure passed between
 * UpdateService, UpdatePipeline, and every downstream component that
 * needs release metadata.
 *
 * No HTTP. No downloads. No installer logic. No UI.
 */

import type { SemanticVersion } from '../version/SemanticVersion';

// ---------------------------------------------------------------------------
// Manifest model
// ---------------------------------------------------------------------------

export interface IUpdateManifest {
  /**
   * Parsed semantic version of the release.
   * Derived from the GitHub release tag (e.g. "v2.1.3" → 2.1.3).
   */
  readonly version: SemanticVersion;

  /**
   * ISO-8601 UTC timestamp of when the release was published on GitHub.
   * Null for releases that were never formally published (should not occur
   * in production but must be handled at the type level).
   */
  readonly releaseDate: string | null;

  /**
   * Markdown-formatted release notes sourced from the GitHub release body.
   * Empty string when the release has no body.
   */
  readonly releaseNotes: string;

  /**
   * Direct download URL for the platform-specific installer asset.
   * Sourced from GitHubReleaseAsset.downloadUrl.
   */
  readonly downloadUrl: string;

  /**
   * SHA-256 hex-encoded checksum of the installer asset.
   * Used by the installer layer to verify download integrity before execution.
   * Sourced from the companion checksum asset attached to the GitHub release.
   */
  readonly sha256Checksum: string;

  /**
   * File name of the installer asset as it appears on the GitHub release
   * (e.g. "kdos-setup-2.1.3-win.exe"). Used by DownloadCache to derive
   * the on-disk file name.
   */
  readonly installerName: string;

  /**
   * Size of the installer asset in bytes. Used by DownloadProgressTracker
   * to compute percentage and ETA before the download begins.
   */
  readonly installerSize: number;

  /**
   * When true, the update pipeline must not allow the user to defer or
   * dismiss this update. The installer must be applied before KDOS resumes.
   */
  readonly mandatoryUpdate: boolean;

  /**
   * The oldest installed version that may upgrade directly to this release.
   * When the installed version is older than this, the pipeline must refuse
   * the direct upgrade and guide the user through an intermediate release.
   * Null when no minimum is declared (any installed version may upgrade).
   */
  readonly minimumSupportedVersion: SemanticVersion | null;
}

// ---------------------------------------------------------------------------
// Parser input contract
// ---------------------------------------------------------------------------

/**
 * All data required by UpdateManifestParser to construct an UpdateManifest.
 * The caller (UpdateService / UpdatePipeline) resolves platform specifics
 * before invoking the parser — the manifest layer never branches on platform.
 */
export interface UpdateManifestParserInput {
  /**
   * The raw GitHub release object from IGitHubReleaseProvider.getLatestRelease().
   * Imported from src/platform/github/models/GitHubRelease.ts.
   */
  readonly release: import('../../github/models/GitHubRelease').GitHubRelease;

  /**
   * The platform-specific installer asset, already resolved by the caller
   * (e.g. via GitHubUpdateProvider.resolvePlatformAsset()).
   */
  readonly installerAsset: import('../../github/models/GitHubRelease').GitHubReleaseAsset;

  /**
   * The SHA-256 hex checksum string for the installer asset.
   * Sourced from a companion checksum asset (e.g. "kdos-setup-2.1.3-win.exe.sha256")
   * and fetched / read by the caller before invoking the parser.
   */
  readonly sha256Checksum: string;

  /**
   * When true, the pipeline will mark this manifest as a mandatory update.
   * Determined by the caller (e.g. by inspecting release notes for a
   * [MANDATORY] marker, or via a separate release metadata field).
   */
  readonly mandatoryUpdate: boolean;

  /**
   * Raw string of the minimum supported version, if any
   * (e.g. "2.0.0"). The parser converts this to a SemanticVersion.
   * Null or undefined when no minimum is declared.
   */
  readonly minimumSupportedVersion?: string | null;
}

// ---------------------------------------------------------------------------
// Parser contract
// ---------------------------------------------------------------------------

export interface IUpdateManifestParser {
  /**
   * Converts raw GitHub release data into a canonical UpdateManifest.
   *
   * Does not perform HTTP requests.
   * Does not perform downloads.
   * Does not implement installer logic.
   * Does not interact with the file system.
   *
   * @param input - All data required to build the manifest.
   * @returns     A fully populated, immutable UpdateManifest.
   * @throws      UpdateManifestParseError when required fields are missing
   *              or cannot be parsed into their target types.
   */
  parse(input: UpdateManifestParserInput): IUpdateManifest;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class UpdateManifestParseError extends Error {
  public readonly field: string;
  public readonly cause: unknown;

  constructor(field: string, reason: string, cause?: unknown) {
    super(`UpdateManifest: failed to parse field "${field}": ${reason}`);
    this.name  = 'UpdateManifestParseError';
    this.field = field;
    this.cause = cause;
  }
}