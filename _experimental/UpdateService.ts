/**
 * UpdateService
 *
 * Coordinates the complete KDOS update workflow:
 *   1. Fetch the remote version manifest
 *   2. Compare against the installed version
 *   3. Download the package if a newer version exists
 *   4. Verify the package via PackageVerifier
 *   5. Install and restart
 *
 * All platform I/O is delegated to injected gateways.
 */

import { PackageVerifier } from "./PackageVerifier";

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export interface UpdateManifest {
  readonly version: string;
  readonly buildNumber: string;
  readonly releaseDate: string;
  readonly packageName: string;
  readonly packageSize: number;
  readonly sha256: string;
  readonly releaseNotes: string;
  readonly minimumVersion: string;
}

// ---------------------------------------------------------------------------
// Gateways
// ---------------------------------------------------------------------------

export interface UpdateNetworkGateway {
  fetchText(url: string): Promise<string>;
  downloadFile(url: string, absoluteDestinationPath: string): Promise<void>;
}

export interface UpdateRestartGateway {
  scheduleRelaunch(): void;
  exitProcess(code: number): void;
}

// ---------------------------------------------------------------------------
// Options / results
// ---------------------------------------------------------------------------

export interface UpdateServiceOptions {
  readonly currentVersion: string;
  readonly manifestUrl: string;
  readonly packageDownloadUrl: string;
  readonly absoluteDownloadPath: string;
}

export type UpdateStatus =
  | "UpToDate"
  | "UpdateAvailable"
  | "Downloading"
  | "Verifying"
  | "Installing"
  | "Restarting"
  | "Failed";

export interface UpdateServiceResult {
  readonly status: UpdateStatus;
  readonly currentVersion: string;
  readonly availableVersion: string | undefined;
  readonly errorMessage: string | undefined;
}

// ---------------------------------------------------------------------------
// Semantic version comparison (self-contained — no external helper assumed)
// ---------------------------------------------------------------------------

interface ParsedSemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: string | undefined;
}

function parseSemVer(version: string): ParsedSemVer {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version.trim());
  if (match === null) {
    throw new Error(`Invalid semantic version: "${version}"`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

function isVersionNewer(candidate: string, baseline: string): boolean {
  const c = parseSemVer(candidate);
  const b = parseSemVer(baseline);
  if (c.major !== b.major) return c.major > b.major;
  if (c.minor !== b.minor) return c.minor > b.minor;
  if (c.patch !== b.patch) return c.patch > b.patch;
  // No prerelease > prerelease present (release is newer than pre-release)
  if (c.prerelease === undefined && b.prerelease !== undefined) return true;
  if (c.prerelease !== undefined && b.prerelease === undefined) return false;
  if (c.prerelease === undefined && b.prerelease === undefined) return false;
  return (c.prerelease as string) > (b.prerelease as string);
}

// ---------------------------------------------------------------------------
// UpdateService
// ---------------------------------------------------------------------------

export class UpdateService {
  private readonly network: UpdateNetworkGateway;
  private readonly verifier: PackageVerifier;
  private readonly restart: UpdateRestartGateway;
  private readonly options: UpdateServiceOptions;

  public constructor(
    network: UpdateNetworkGateway,
    verifier: PackageVerifier,
    restart: UpdateRestartGateway,
    options: UpdateServiceOptions
  ) {
    this.network = network;
    this.verifier = verifier;
    this.restart = restart;
    this.options = options;
  }

  public async checkAndInstall(): Promise<UpdateServiceResult> {
    let manifest: UpdateManifest;

    try {
      const json = await this.network.fetchText(this.options.manifestUrl);
      manifest = JSON.parse(json) as UpdateManifest;
    } catch (error) {
      return this.failed(
        undefined,
        error instanceof Error ? error.message : "Failed to fetch update manifest."
      );
    }

    if (!isVersionNewer(manifest.version, this.options.currentVersion)) {
      return {
        status: "UpToDate",
        currentVersion: this.options.currentVersion,
        availableVersion: manifest.version,
        errorMessage: undefined,
      };
    }

    try {
      await this.network.downloadFile(
        this.options.packageDownloadUrl,
        this.options.absoluteDownloadPath
      );
    } catch (error) {
      return this.failed(
        manifest.version,
        error instanceof Error ? error.message : "Failed to download update package."
      );
    }

    const verificationReport = await this.verifier.validatePackage();

    if (!verificationReport.overallStatus) {
      const firstError = verificationReport.issues[0];
      return this.failed(
        manifest.version,
        firstError !== undefined ? firstError.message : "Package verification failed."
      );
    }

    this.restart.scheduleRelaunch();
    this.restart.exitProcess(0);

    return {
      status: "Restarting",
      currentVersion: this.options.currentVersion,
      availableVersion: manifest.version,
      errorMessage: undefined,
    };
  }

  private failed(
    availableVersion: string | undefined,
    errorMessage: string
  ): UpdateServiceResult {
    return {
      status: "Failed",
      currentVersion: this.options.currentVersion,
      availableVersion,
      errorMessage,
    };
  }
}