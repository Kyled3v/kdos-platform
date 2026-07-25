/**
 * UpdateDetector
 *
 * Coordinates the update search.
 */

import { UpdateScanner, PackageDescriptor } from "./UpdateScanner";
import { PackageRepository } from "./PackageRepository";
import { VersionComparator, VersionComparisonResult } from "./VersionComparator";

export interface UpdateDetectorOptions {
  readonly currentApplicationVersion: string;
}

export interface UpdateDetectionResult {
  readonly updateAvailable: boolean;
  readonly currentVersion: string;
  readonly latestPackage: PackageDescriptor | undefined;
  readonly comparison: VersionComparisonResult | undefined;
}

export class UpdateDetector {
  private readonly scanner: UpdateScanner;
  private readonly repository: PackageRepository;
  private readonly versionComparator: VersionComparator;
  private readonly options: UpdateDetectorOptions;

  public constructor(
    scanner: UpdateScanner,
    repository: PackageRepository,
    versionComparator: VersionComparator,
    options: UpdateDetectorOptions
  ) {
    this.scanner = scanner;
    this.repository = repository;
    this.versionComparator = versionComparator;
    this.options = options;
  }

  public async initialize(): Promise<void> {
    await this.repository.loadPackages();
  }

  public async scan(): Promise<ReadonlyArray<PackageDescriptor>> {
    const descriptors = await this.scanner.findPackages();

    for (const descriptor of descriptors) {
      const isValid = await this.scanner.validatePackage(descriptor);

      if (isValid) {
        await this.repository.savePackage(descriptor);
      }
    }

    return descriptors;
  }

  public findLatest(): PackageDescriptor | undefined {
    return this.repository.getLatestPackage();
  }

  public compare(packageVersion: string): VersionComparisonResult {
    return this.versionComparator.compare(
      packageVersion,
      this.options.currentApplicationVersion
    );
  }

  public async detect(): Promise<UpdateDetectionResult> {
    await this.scan();

    const latestPackage = this.findLatest();

    if (latestPackage === undefined) {
      return {
        updateAvailable: false,
        currentVersion: this.options.currentApplicationVersion,
        latestPackage: undefined,
        comparison: undefined,
      };
    }

    const comparison = this.compare(latestPackage.manifest.applicationVersion);

    return {
      updateAvailable: comparison === "Newer",
      currentVersion: this.options.currentApplicationVersion,
      latestPackage,
      comparison,
    };
  }
}