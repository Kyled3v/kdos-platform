/**
 * src/platform/update/manifest/UpdateManifestParser.ts
 *
 * Production implementation of IUpdateManifestParser.
 *
 * Converts a GitHubRelease + resolved installer asset into the canonical
 * UpdateManifest used throughout the KDOS update pipeline.
 *
 * Responsibilities
 *   - Parse and validate every required field
 *   - Convert tagName → SemanticVersion via VersionComparator layer
 *   - Normalise optional fields to safe defaults
 *   - Throw UpdateManifestParseError with a precise field name on any failure
 *
 * Non-responsibilities (handled by callers)
 *   - HTTP requests
 *   - Asset resolution / platform detection
 *   - Checksum fetching
 *   - Downloads
 *   - Installer execution
 *   - UI
 */

import {
  SemanticVersion,
  SemanticVersionParseError,
} from '../version/SemanticVersion';

import {
  IUpdateManifestParser,
  IUpdateManifest,
  UpdateManifestParserInput,
  UpdateManifestParseError,
} from './IUpdateManifest';

import { UpdateManifest } from './UpdateManifest';

export class UpdateManifestParser implements IUpdateManifestParser {
  /**
   * Converts raw GitHub release data into an immutable UpdateManifest.
   *
   * @param input - Resolved release, installer asset, checksum, and flags.
   * @returns     A fully populated UpdateManifest.
   * @throws      UpdateManifestParseError on any validation or parse failure.
   */
  public parse(input: UpdateManifestParserInput): IUpdateManifest {
    const version                 = this.parseVersion(input.release.tagName);
    const releaseDate             = this.parseReleaseDate(input.release.publishedAt);
    const releaseNotes            = this.parseReleaseNotes(input.release.releaseNotes);
    const downloadUrl             = this.parseDownloadUrl(input.installerAsset.downloadUrl);
    const sha256Checksum          = this.parseSha256Checksum(input.sha256Checksum);
    const installerName           = this.parseInstallerName(input.installerAsset.name);
    const installerSize           = this.parseInstallerSize(input.installerAsset.size);
    const mandatoryUpdate         = input.mandatoryUpdate;
    const minimumSupportedVersion = this.parseMinimumSupportedVersion(
      input.minimumSupportedVersion ?? null,
    );

    return new UpdateManifest({
      version,
      releaseDate,
      releaseNotes,
      downloadUrl,
      sha256Checksum,
      installerName,
      installerSize,
      mandatoryUpdate,
      minimumSupportedVersion,
    });
  }

  // ---------------------------------------------------------------------------
  // Field parsers — each validates and converts exactly one field
  // ---------------------------------------------------------------------------

  private parseVersion(tagName: string): SemanticVersion {
    const trimmed = tagName.trim();
    if (trimmed.length === 0) {
      throw new UpdateManifestParseError('version', 'tag_name is empty');
    }

    try {
      return SemanticVersion.parse(trimmed);
    } catch (error) {
      if (error instanceof SemanticVersionParseError) {
        throw new UpdateManifestParseError(
          'version',
          `tag_name "${tagName}" is not a valid semantic version`,
          error,
        );
      }
      throw new UpdateManifestParseError(
        'version',
        `unexpected error parsing tag_name "${tagName}"`,
        error,
      );
    }
  }

  private parseReleaseDate(publishedAt: string | null): string | null {
    if (publishedAt === null) return null;

    const trimmed = publishedAt.trim();
    if (trimmed.length === 0) return null;

    // Validate that the string is a parseable ISO-8601 date.
    const timestamp = Date.parse(trimmed);
    if (Number.isNaN(timestamp)) {
      throw new UpdateManifestParseError(
        'releaseDate',
        `published_at "${publishedAt}" is not a valid ISO-8601 date`,
      );
    }

    return trimmed;
  }

  private parseReleaseNotes(body: string): string {
    // releaseNotes is always a string per GitHubRelease model (empty string
    // when the release has no body). No validation required beyond type safety.
    return body.trim();
  }

  private parseDownloadUrl(downloadUrl: string): string {
    const trimmed = downloadUrl.trim();
    if (trimmed.length === 0) {
      throw new UpdateManifestParseError(
        'downloadUrl',
        'installer asset browser_download_url is empty',
      );
    }

    // Verify the URL is structurally valid and uses a safe scheme.
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch (error) {
      throw new UpdateManifestParseError(
        'downloadUrl',
        `installer asset browser_download_url "${trimmed}" is not a valid URL`,
        error,
      );
    }

    if (parsed.protocol !== 'https:') {
      throw new UpdateManifestParseError(
        'downloadUrl',
        `installer asset download URL must use HTTPS, got "${parsed.protocol}"`,
      );
    }

    return trimmed;
  }

  private parseSha256Checksum(checksum: string): string {
    const trimmed = checksum.trim().toLowerCase();

    if (trimmed.length === 0) {
      throw new UpdateManifestParseError(
        'sha256Checksum',
        'checksum is empty',
      );
    }

    // SHA-256 hex digest is always exactly 64 lowercase hex characters.
    if (!/^[0-9a-f]{64}$/.test(trimmed)) {
      throw new UpdateManifestParseError(
        'sha256Checksum',
        `"${checksum}" is not a valid SHA-256 hex digest (expected 64 hex characters)`,
      );
    }

    return trimmed;
  }

  private parseInstallerName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new UpdateManifestParseError(
        'installerName',
        'installer asset name is empty',
      );
    }
    return trimmed;
  }

  private parseInstallerSize(size: number): number {
    if (!Number.isInteger(size) || size <= 0) {
      throw new UpdateManifestParseError(
        'installerSize',
        `installer asset size must be a positive integer, got ${size}`,
      );
    }
    return size;
  }

  private parseMinimumSupportedVersion(
    raw: string | null,
  ): SemanticVersion | null {
    if (raw === null) return null;

    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;

    try {
      return SemanticVersion.parse(trimmed);
    } catch (error) {
      if (error instanceof SemanticVersionParseError) {
        throw new UpdateManifestParseError(
          'minimumSupportedVersion',
          `"${raw}" is not a valid semantic version`,
          error,
        );
      }
      throw new UpdateManifestParseError(
        'minimumSupportedVersion',
        `unexpected error parsing "${raw}"`,
        error,
      );
    }
  }
}