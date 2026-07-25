/**
 * PackageRepository
 *
 * Represents available update packages.
 */

import { PackageDescriptor } from "./UpdateScanner";
import { VersionComparator } from "./VersionComparator";

export interface RepositoryStorageGateway {
  loadAll(): Promise<ReadonlyArray<PackageDescriptor>>;
  persist(packages: ReadonlyArray<PackageDescriptor>): Promise<void>;
  deletePackageFile(packagePath: string): Promise<void>;
}

export class PackageRepository {
  private readonly storage: RepositoryStorageGateway;
  private readonly versionComparator: VersionComparator;
  private packages: ReadonlyArray<PackageDescriptor>;

  public constructor(storage: RepositoryStorageGateway, versionComparator: VersionComparator) {
    this.storage = storage;
    this.versionComparator = versionComparator;
    this.packages = [];
  }

  public async loadPackages(): Promise<ReadonlyArray<PackageDescriptor>> {
    this.packages = await this.storage.loadAll();
    return this.packages;
  }

  public async savePackage(descriptor: PackageDescriptor): Promise<void> {
    const withoutExisting = this.packages.filter(
      (existing) =>
        existing.manifest.applicationVersion !== descriptor.manifest.applicationVersion
    );

    this.packages = [...withoutExisting, descriptor];

    await this.storage.persist(this.packages);
  }

  public async removePackage(version: string): Promise<void> {
    const target = this.packages.find(
      (descriptor) => descriptor.manifest.applicationVersion === version
    );

    this.packages = this.packages.filter(
      (descriptor) => descriptor.manifest.applicationVersion !== version
    );

    await this.storage.persist(this.packages);

    if (target !== undefined) {
      await this.storage.deletePackageFile(target.packagePath);
    }
  }

  public getLatestPackage(): PackageDescriptor | undefined {
    if (this.packages.length === 0) {
      return undefined;
    }

    return this.packages.reduce((latest, current) =>
      this.versionComparator.isNewer(
        current.manifest.applicationVersion,
        latest.manifest.applicationVersion
      )
        ? current
        : latest
    );
  }

  public findPackage(version: string): PackageDescriptor | undefined {
    return this.packages.find((descriptor) => descriptor.manifest.applicationVersion === version);
  }
}