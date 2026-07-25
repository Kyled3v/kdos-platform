/**
 * AutoUpdater
 *
 * Coordinates the end-to-end KDOS update workflow: detecting available
 * packages, ensuring a package is ready, verifying and installing it,
 * and requesting an application restart. All installation-specific
 * business logic remains delegated to PackageVerifier and
 * PackageInstaller; AutoUpdater only sequences the workflow and
 * communicates state changes to the UpdateManager.
 */

import { UpdateDetector, UpdateDetectionResult } from "./UpdateDetector";
import { PackageDescriptor } from "./UpdateScanner";
import { PackageVerifier, PackageVerificationReport } from "./PackageVerifier";
import { PackageInstaller, InstallationResult } from "./PackageInstaller";

export interface PackageDownloadGateway {
  ensurePackageAvailable(descriptor: PackageDescriptor): Promise<PackageDescriptor>;
}

export interface UpdateManagerNotifier {
  notifyUpdateDetected(detection: UpdateDetectionResult): Promise<void>;
  notifyInstallationStarted(descriptor: PackageDescriptor): Promise<void>;
  notifyInstallationCompleted(result: InstallationResult): Promise<void>;
  notifyRestartRequested(): Promise<void>;
}

export interface AutoUpdaterOptions {
  readonly currentApplicationVersion: string;
}

export type AutoUpdaterStage =
  | "Idle"
  | "Checking"
  | "UpdateAvailable"
  | "UpToDate"
  | "Downloading"
  | "Verifying"
  | "Installing"
  | "Completed"
  | "Failed";

export interface AutoUpdaterSnapshot {
  readonly stage: AutoUpdaterStage;
  readonly currentVersion: string;
  readonly latestVersion: string | undefined;
  readonly releaseNotes: string | undefined;
  readonly statusMessage: string;
}

export type AutoUpdaterSnapshotListener = (snapshot: AutoUpdaterSnapshot) => void;

export class AutoUpdater {
  private readonly detector: UpdateDetector;
  private readonly verifier: PackageVerifier;
  private readonly installer: PackageInstaller;
  private readonly downloadGateway: PackageDownloadGateway;
  private readonly updateManager: UpdateManagerNotifier;
  private readonly options: AutoUpdaterOptions;
  private readonly onSnapshot: AutoUpdaterSnapshotListener | undefined;

  private latestDetection: UpdateDetectionResult | undefined;
  private preparedPackage: PackageDescriptor | undefined;
  private stage: AutoUpdaterStage;

  public constructor(
    detector: UpdateDetector,
    verifier: PackageVerifier,
    installer: PackageInstaller,
    downloadGateway: PackageDownloadGateway,
    updateManager: UpdateManagerNotifier,
    options: AutoUpdaterOptions,
    onSnapshot?: AutoUpdaterSnapshotListener
  ) {
    this.detector = detector;
    this.verifier = verifier;
    this.installer = installer;
    this.downloadGateway = downloadGateway;
    this.updateManager = updateManager;
    this.options = options;
    this.onSnapshot = onSnapshot;
    this.stage = "Idle";
  }

  public async initialize(): Promise<void> {
    this.stage = "Idle";
    await this.detector.initialize();
    this.emitSnapshot("Ready to check for updates.");
  }

  public async checkForUpdates(): Promise<UpdateDetectionResult> {
    this.stage = "Checking";
    this.emitSnapshot("Checking for updates.");

    const detection = await this.detector.detect();
    this.latestDetection = detection;

    await this.updateManager.notifyUpdateDetected(detection);

    this.stage = detection.updateAvailable ? "UpdateAvailable" : "UpToDate";
    this.emitSnapshot(
      detection.updateAvailable
        ? `Update available: ${detection.latestPackage?.manifest.applicationVersion ?? ""}`
        : "KDOS is up to date."
    );

    return detection;
  }

  public async download(): Promise<PackageDescriptor> {
    if (
      this.latestDetection === undefined ||
      this.latestDetection.latestPackage === undefined
    ) {
      throw new Error("No update has been detected. Call checkForUpdates() first.");
    }

    this.stage = "Downloading";
    this.emitSnapshot("Preparing update package.");

    const preparedPackage = await this.downloadGateway.ensurePackageAvailable(
      this.latestDetection.latestPackage
    );

    this.preparedPackage = preparedPackage;

    this.emitSnapshot("Update package ready.");

    return preparedPackage;
  }

  public async install(): Promise<InstallationResult> {
    if (this.preparedPackage === undefined) {
      throw new Error("Package must be downloaded before it can be installed.");
    }

    this.stage = "Verifying";
    this.emitSnapshot("Verifying update package.");

    const verificationReport: PackageVerificationReport = await this.verifier.verifyPackage(
      this.preparedPackage.manifest
    );

    if (!verificationReport.overallSuccessful) {
      this.stage = "Failed";
      this.emitSnapshot("Update package failed verification.");

      return {
        successful: false,
        installedVersion: this.options.currentApplicationVersion,
        restartRequired: false,
        rollbackAvailable: false,
        message: "Update package failed verification.",
      };
    }

    this.stage = "Installing";
    await this.updateManager.notifyInstallationStarted(this.preparedPackage);

    await this.installer.initialize();
    await this.installer.prepareInstallation();

    this.emitSnapshot("Backing up current installation.");
    await this.installer.backupCurrentFiles();

    this.emitSnapshot("Extracting update package.");
    await this.installer.extractPackage();

    this.emitSnapshot("Replacing application files.");
    await this.installer.replaceFiles();

    this.emitSnapshot("Running migrations.");
    await this.installer.runMigrations();

    this.emitSnapshot("Finalizing installation.");
    const result = await this.installer.finalizeInstallation();
    await this.installer.cleanup();

    this.stage = result.successful ? "Completed" : "Failed";
    this.emitSnapshot(result.message);

    await this.updateManager.notifyInstallationCompleted(result);

    return result;
  }

  public async restart(): Promise<void> {
    this.emitSnapshot("Restarting KDOS.");
    await this.installer.restartApplication();
    await this.updateManager.notifyRestartRequested();
  }

  public getSnapshot(): AutoUpdaterSnapshot {
    return this.buildSnapshot(`Stage: ${this.stage}`);
  }

  private emitSnapshot(statusMessage: string): void {
    if (this.onSnapshot === undefined) {
      return;
    }

    this.onSnapshot(this.buildSnapshot(statusMessage));
  }

  private buildSnapshot(statusMessage: string): AutoUpdaterSnapshot {
    return {
      stage: this.stage,
      currentVersion: this.options.currentApplicationVersion,
      latestVersion: this.latestDetection?.latestPackage?.manifest.applicationVersion,
      releaseNotes: undefined,
      statusMessage,
    };
  }
}
