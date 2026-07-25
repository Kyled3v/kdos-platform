/**
 * UpdateScanner
 *
 * Scans storage/updates/packages/ for available KDOS packages.
 */

import { Manifest } from "./Manifest";

export interface PackageStorageGateway {
  directoryExists(directoryPath: string): Promise<boolean>;
  listPackageFiles(directoryPath: string): Promise<ReadonlyArray<string>>;
  joinPath(...segments: ReadonlyArray<string>): string;
  fileExists(filePath: string): Promise<boolean>;
  readManifest(packagePath: string): Promise<Manifest>;
}

export interface PackageDescriptor {
  readonly packagePath: string;
  readonly manifest: Manifest;
}

export interface UpdateScannerOptions {
  readonly packagesDirectoryPath: string;
  readonly packageFileExtension: string;
}

export class UpdateScanner {
  private readonly storage: PackageStorageGateway;
  private readonly options: UpdateScannerOptions;

  public constructor(storage: PackageStorageGateway, options: UpdateScannerOptions) {
    this.storage = storage;
    this.options = options;
  }

  public async scan(): Promise<ReadonlyArray<string>> {
    const directoryExists = await this.storage.directoryExists(
      this.options.packagesDirectoryPath
    );

    if (!directoryExists) {
      return [];
    }

    const allFiles = await this.storage.listPackageFiles(this.options.packagesDirectoryPath);

    return allFiles.filter((fileName) => fileName.endsWith(this.options.packageFileExtension));
  }

  public async findPackages(): Promise<ReadonlyArray<PackageDescriptor>> {
    const fileNames = await this.scan();
    const descriptors: PackageDescriptor[] = [];

    for (const fileName of fileNames) {
      const packagePath = this.storage.joinPath(
        this.options.packagesDirectoryPath,
        fileName
      );

      const manifest = await this.loadManifest(packagePath);
      descriptors.push({ packagePath, manifest });
    }

    return descriptors;
  }

  public async loadManifest(packagePath: string): Promise<Manifest> {
    return this.storage.readManifest(packagePath);
  }

  public async validatePackage(descriptor: PackageDescriptor): Promise<boolean> {
    const packageExists = await this.storage.fileExists(descriptor.packagePath);

    if (!packageExists) {
      return false;
    }

    return (
      descriptor.manifest.applicationName.length > 0 &&
      descriptor.manifest.applicationVersion.length > 0 &&
      descriptor.manifest.fileList.length > 0 &&
      descriptor.manifest.packageSize > 0
    );
  }
}