/**
 * src/platform/update/manifest/UpdateManifest.ts
 *
 * Immutable value object implementing IUpdateManifest.
 *
 * Constructed exclusively by UpdateManifestParser — no other module
 * instantiates this class directly. All fields are readonly and set
 * once at construction time; no mutation is possible after creation.
 *
 * No HTTP. No downloads. No installer logic. No UI.
 */

import type { SemanticVersion } from '../version/SemanticVersion';
import type { IUpdateManifest } from './IUpdateManifest';

export class UpdateManifest implements IUpdateManifest {
  public readonly version:                  SemanticVersion;
  public readonly releaseDate:              string | null;
  public readonly releaseNotes:             string;
  public readonly downloadUrl:              string;
  public readonly sha256Checksum:           string;
  public readonly installerName:            string;
  public readonly installerSize:            number;
  public readonly mandatoryUpdate:          boolean;
  public readonly minimumSupportedVersion:  SemanticVersion | null;

  /**
   * Package-internal constructor.
   * Callers outside the manifest module must use UpdateManifestParser.parse().
   */
  public constructor(fields: IUpdateManifest) {
    this.version                 = fields.version;
    this.releaseDate             = fields.releaseDate;
    this.releaseNotes            = fields.releaseNotes;
    this.downloadUrl             = fields.downloadUrl;
    this.sha256Checksum          = fields.sha256Checksum;
    this.installerName           = fields.installerName;
    this.installerSize           = fields.installerSize;
    this.mandatoryUpdate         = fields.mandatoryUpdate;
    this.minimumSupportedVersion = fields.minimumSupportedVersion;
  }

  // ---------------------------------------------------------------------------
  // Derived helpers — consumed by UpdatePipeline without importing SemanticVersion
  // ---------------------------------------------------------------------------

  /**
   * Human-readable version string without a leading "v".
   * Example: "2.1.3"
   */
  public get versionString(): string {
    return this.version.toString();
  }

  /**
   * Returns true when the given installed version satisfies the minimum
   * supported version declared by this manifest.
   *
   * Always returns true when minimumSupportedVersion is null (no floor set).
   * Returns false when installedVersion is older than minimumSupportedVersion,
   * indicating the pipeline must block a direct upgrade.
   */
  public isDirectUpgradeSupported(installedVersion: SemanticVersion): boolean {
    if (this.minimumSupportedVersion === null) return true;
    return !installedVersion.isOlderThan(this.minimumSupportedVersion);
  }

  /**
   * Returns a plain-object snapshot of the manifest suitable for
   * structured logging. No SemanticVersion instances are included —
   * only primitive-typed fields.
   */
  public toLogRecord(): Record<string, string | number | boolean | null> {
    return {
      version:                 this.versionString,
      releaseDate:             this.releaseDate,
      installerName:           this.installerName,
      installerSize:           this.installerSize,
      downloadUrl:             this.downloadUrl,
      sha256Checksum:          this.sha256Checksum,
      mandatoryUpdate:         this.mandatoryUpdate,
      minimumSupportedVersion: this.minimumSupportedVersion?.toString() ?? null,
    };
  }
}