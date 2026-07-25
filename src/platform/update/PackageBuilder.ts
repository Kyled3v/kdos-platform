/**
 * PackageBuilder
 *
 * Responsible for generating a KDOS update package ready for future
 * verification and installation.
 *
 * PackageBuilder DOES NOT install updates.
 * PackageBuilder DOES NOT communicate over the internet.
 */

import { Manifest, ManifestFileEntry, createManifest, serializeManifest } from "./Manifest";

export interface FileSystemGateway {
  pathExists(targetPath: string): Promise<boolean>;
  createDirectory(targetPath: string): Promise<void>;
  removeDirectory(targetPath: string): Promise<void>;
  listFilesRecursive(rootPath: string): Promise<ReadonlyArray<string>>;
  getFileSize(filePath: string): Promise<number>;
  copyFile(sourcePath: string, destinationPath: string): Promise<void>;
  writeTextFile(filePath: string, contents: string): Promise<void>;
  createArchive(sourceDirectoryPath: string, archiveDestinationPath: string): Promise<void>;
  joinPath(...segments: ReadonlyArray<string>): string;
}

export interface ChecksumGateway {
  computeFileChecksum(filePath: string): Promise<string>;
  computeTextChecksum(contents: string): Promise<string>;
}

export interface CollectedFile {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly sizeInBytes: number;
}

export interface ChecksummedFile {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly sizeInBytes: number;
  readonly checksum: string;
}

export interface PackageBuilderOptions {
  readonly applicationName: string;
  readonly applicationVersion: string;
  readonly buildNumber: string;
  readonly releaseDate: Date;
  readonly sourceRootPath: string;
  readonly stagingRootPath: string;
  readonly packagesOutputPath: string;
}

export interface BuiltPackage {
  readonly packagePath: string;
  readonly manifest: Manifest;
  readonly manifestPath: string;
}

const DEFAULT_PACKAGES_OUTPUT_PATH = "storage/updates/packages";
const MANIFEST_FILE_NAME = "manifest.json";
const PACKAGE_FILE_EXTENSION = "kdospkg";

export class PackageBuilder {
  private readonly fileSystem: FileSystemGateway;
  private readonly checksums: ChecksumGateway;
  private readonly options: PackageBuilderOptions;

  private stagingPath: string | undefined;
  private collectedFiles: ReadonlyArray<CollectedFile> | undefined;
  private checksummedFiles: ReadonlyArray<ChecksummedFile> | undefined;
  private packageSizeInBytes: number | undefined;
  private manifest: Manifest | undefined;

  public constructor(
    fileSystem: FileSystemGateway,
    checksums: ChecksumGateway,
    options: PackageBuilderOptions
  ) {
    this.fileSystem = fileSystem;
    this.checksums = checksums;
    this.options = options;
  }

  public async initialize(): Promise<void> {
    const sourceExists = await this.fileSystem.pathExists(this.options.sourceRootPath);

    if (!sourceExists) {
      throw new Error(`Source root path does not exist: ${this.options.sourceRootPath}`);
    }

    const outputPath = this.resolvePackagesOutputPath();
    const outputExists = await this.fileSystem.pathExists(outputPath);

    if (!outputExists) {
      await this.fileSystem.createDirectory(outputPath);
    }
  }

  public async createStagingArea(): Promise<string> {
    const stagingExists = await this.fileSystem.pathExists(this.options.stagingRootPath);

    if (stagingExists) {
      await this.fileSystem.removeDirectory(this.options.stagingRootPath);
    }

    await this.fileSystem.createDirectory(this.options.stagingRootPath);

    this.stagingPath = this.options.stagingRootPath;

    return this.stagingPath;
  }

  public async collectApplicationFiles(): Promise<ReadonlyArray<CollectedFile>> {
    if (this.stagingPath === undefined) {
      throw new Error("Staging area must be created before files can be collected.");
    }

    const relativePaths = await this.fileSystem.listFilesRecursive(this.options.sourceRootPath);
    const collected: CollectedFile[] = [];

    for (const relativePath of relativePaths) {
      const sourcePath = this.fileSystem.joinPath(this.options.sourceRootPath, relativePath);
      const destinationPath = this.fileSystem.joinPath(this.stagingPath, relativePath);
      const sizeInBytes = await this.fileSystem.getFileSize(sourcePath);

      await this.fileSystem.copyFile(sourcePath, destinationPath);

      collected.push({
        relativePath,
        absolutePath: destinationPath,
        sizeInBytes,
      });
    }

    this.collectedFiles = collected;

    return collected;
  }

  public async calculateChecksums(): Promise<ReadonlyArray<ChecksummedFile>> {
    if (this.collectedFiles === undefined) {
      throw new Error("Files must be collected before checksums can be calculated.");
    }

    const checksummed: ChecksummedFile[] = [];

    for (const file of this.collectedFiles) {
      const checksum = await this.checksums.computeFileChecksum(file.absolutePath);

      checksummed.push({
        relativePath: file.relativePath,
        absolutePath: file.absolutePath,
        sizeInBytes: file.sizeInBytes,
        checksum,
      });
    }

    this.checksummedFiles = checksummed;

    return checksummed;
  }

  public calculatePackageSize(): number {
    if (this.collectedFiles === undefined) {
      throw new Error("Files must be collected before the package size can be calculated.");
    }

    const totalSizeInBytes = this.collectedFiles.reduce(
      (accumulatedSize, file) => accumulatedSize + file.sizeInBytes,
      0
    );

    this.packageSizeInBytes = totalSizeInBytes;

    return totalSizeInBytes;
  }

  public async generateManifest(): Promise<Manifest> {
    if (this.checksummedFiles === undefined) {
      throw new Error("Checksums must be calculated before the manifest can be generated.");
    }

    if (this.stagingPath === undefined) {
      throw new Error("Staging area must exist before the manifest can be generated.");
    }

    const packageSize = this.packageSizeInBytes ?? this.calculatePackageSize();

    const fileList: ReadonlyArray<ManifestFileEntry> = this.checksummedFiles.map((file) => ({
      relativePath: file.relativePath,
      sizeInBytes: file.sizeInBytes,
      checksum: file.checksum,
    }));

    const packageName = this.buildPackageName();
    const manifestChecksumSource = fileList
      .map((file) => `${file.relativePath}:${file.checksum}`)
      .join("|");
    const checksum = await this.checksums.computeTextChecksum(manifestChecksumSource);

    const manifest = createManifest({
      applicationName: this.options.applicationName,
      applicationVersion: this.options.applicationVersion,
      buildNumber: this.options.buildNumber,
      releaseDate: this.options.releaseDate,
      packageName,
      checksum,
      fileList,
      packageSize,
    });

    const manifestPath = this.fileSystem.joinPath(this.stagingPath, MANIFEST_FILE_NAME);
    await this.fileSystem.writeTextFile(manifestPath, serializeManifest(manifest));

    this.manifest = manifest;

    return manifest;
  }

  public async buildPackage(): Promise<BuiltPackage> {
    if (this.stagingPath === undefined || this.manifest === undefined) {
      throw new Error("Staging area and manifest must exist before the package can be built.");
    }

    const outputPath = this.resolvePackagesOutputPath();
    const packagePath = this.fileSystem.joinPath(outputPath, this.manifest.packageName);
    const manifestPath = this.fileSystem.joinPath(this.stagingPath, MANIFEST_FILE_NAME);

    await this.fileSystem.createArchive(this.stagingPath, packagePath);

    return {
      packagePath,
      manifest: this.manifest,
      manifestPath,
    };
  }

  public async cleanup(): Promise<void> {
    if (this.stagingPath === undefined) {
      return;
    }

    const stagingExists = await this.fileSystem.pathExists(this.stagingPath);

    if (stagingExists) {
      await this.fileSystem.removeDirectory(this.stagingPath);
    }

    this.stagingPath = undefined;
    this.collectedFiles = undefined;
    this.checksummedFiles = undefined;
    this.packageSizeInBytes = undefined;
    this.manifest = undefined;
  }

  private resolvePackagesOutputPath(): string {
    return this.options.packagesOutputPath.length > 0
      ? this.options.packagesOutputPath
      : DEFAULT_PACKAGES_OUTPUT_PATH;
  }

  private buildPackageName(): string {
    return `${this.options.applicationName}-${this.options.applicationVersion}-${this.options.buildNumber}.${PACKAGE_FILE_EXTENSION}`;
  }
}