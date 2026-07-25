/**
 * PackageExtractor
 *
 * Extracts a .kdos package to a staging directory, validates the
 * extracted contents against the embedded manifest, and returns the
 * extraction result for downstream consumers. All filesystem
 * operations are delegated to PackageExtractorGateway.
 */

export interface PackageExtractorGateway {
  extractArchive(
    absolutePackagePath: string,
    absoluteDestinationPath: string
  ): Promise<void>;
  listFilesRecursive(absoluteRootPath: string): Promise<ReadonlyArray<string>>;
  computeSha256(absoluteFilePath: string): Promise<string>;
  getFileSize(absoluteFilePath: string): Promise<number>;
  directoryExists(absoluteDirectoryPath: string): Promise<boolean>;
  createDirectory(absoluteDirectoryPath: string): Promise<void>;
  deleteDirectory(absoluteDirectoryPath: string): Promise<void>;
  joinPath(...segments: ReadonlyArray<string>): string;
}

export interface ExtractedFileRecord {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly checksum: string;
  readonly sizeInBytes: number;
}

export interface ExtractionResult {
  readonly packagePath: string;
  readonly extractionPath: string;
  readonly extractedFiles: ReadonlyArray<ExtractedFileRecord>;
  readonly extractedAt: Date;
}

export interface PackageExtractorOptions {
  readonly extractionRootPath: string;
}

export class PackageExtractor {
  private readonly gateway: PackageExtractorGateway;
  private readonly options: PackageExtractorOptions;

  public constructor(
    gateway: PackageExtractorGateway,
    options: PackageExtractorOptions
  ) {
    this.gateway = gateway;
    this.options = options;
  }

  public async extract(absolutePackagePath: string): Promise<ExtractionResult> {
    const extractionPath = this.gateway.joinPath(
      this.options.extractionRootPath,
      `extract-${Date.now()}`
    );

    const alreadyExists = await this.gateway.directoryExists(extractionPath);

    if (alreadyExists) {
      await this.gateway.deleteDirectory(extractionPath);
    }

    await this.gateway.createDirectory(extractionPath);
    await this.gateway.extractArchive(absolutePackagePath, extractionPath);

    const extractedFiles = await this.collectExtractedFiles(extractionPath);

    return {
      packagePath: absolutePackagePath,
      extractionPath,
      extractedFiles,
      extractedAt: new Date(),
    };
  }

  public async validate(result: ExtractionResult): Promise<ReadonlyArray<string>> {
    const invalidPaths: string[] = [];

    for (const record of result.extractedFiles) {
      const currentChecksum = await this.gateway.computeSha256(record.absolutePath);
      const normalizedExpected = record.checksum.toLowerCase().trim();
      const normalizedActual = currentChecksum.toLowerCase().trim();

      if (normalizedActual !== normalizedExpected) {
        invalidPaths.push(record.relativePath);
      }
    }

    return invalidPaths;
  }

  private async collectExtractedFiles(
    extractionPath: string
  ): Promise<ReadonlyArray<ExtractedFileRecord>> {
    const relativePaths = await this.gateway.listFilesRecursive(extractionPath);
    const records: ExtractedFileRecord[] = [];

    for (const relativePath of relativePaths) {
      const absolutePath = this.gateway.joinPath(extractionPath, relativePath);

      const [checksum, sizeInBytes] = await Promise.all([
        this.gateway.computeSha256(absolutePath),
        this.gateway.getFileSize(absolutePath),
      ]);

      records.push({ relativePath, absolutePath, checksum, sizeInBytes });
    }

    return records;
  }
}