import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, readdir, stat, rm } from 'fs/promises';
import { join, resolve } from 'path';

export interface CachedPackageInfo {
  readonly fileName: string;
  readonly filePath: string;
  readonly sizeBytes: number;
}

export class DownloadCacheError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DownloadCacheError';
  }
}

const DEFAULT_CACHE_DIRECTORY = resolve(process.cwd(), 'storage', 'cache');

/**
 * Manages the on-disk cache of downloaded GitHub release packages under
 * storage/cache/. Prevents duplicate downloads and validates cached files
 * against an expected SHA-512 checksum.
 */
export class DownloadCache {
  private readonly cacheDirectory: string;

  constructor(cacheDirectory: string = DEFAULT_CACHE_DIRECTORY) {
    this.cacheDirectory = cacheDirectory;
  }

  public getCacheDirectory(): string {
    return this.cacheDirectory;
  }

  public resolvePackagePath(fileName: string): string {
    return join(this.cacheDirectory, fileName);
  }

  public resolvePartialPath(fileName: string): string {
    return join(this.cacheDirectory, `${fileName}.partial`);
  }

  public async ensureCacheDirectory(): Promise<void> {
    try {
      await mkdir(this.cacheDirectory, { recursive: true });
    } catch (error) {
      throw new DownloadCacheError(
        `Failed to create cache directory "${this.cacheDirectory}"`,
        error
      );
    }
  }

  public async find(fileName: string): Promise<CachedPackageInfo | null> {
    const filePath = this.resolvePackagePath(fileName);

    try {
      const stats = await stat(filePath);
      if (!stats.isFile()) return null;
      return { fileName, filePath, sizeBytes: stats.size };
    } catch {
      return null;
    }
  }

  public async findPartial(fileName: string): Promise<CachedPackageInfo | null> {
    const partialPath = this.resolvePartialPath(fileName);

    try {
      const stats = await stat(partialPath);
      if (!stats.isFile()) return null;
      return { fileName, filePath: partialPath, sizeBytes: stats.size };
    } catch {
      return null;
    }
  }

  /**
   * Returns true if a fully downloaded, checksum-valid package already exists
   * in the cache for the given file name and expected SHA-512 hash.
   */
  public async has(fileName: string, expectedSha512: string): Promise<boolean> {
    const existing = await this.find(fileName);
    if (existing === null) return false;
    return this.validate(existing.filePath, expectedSha512);
  }

  public async validate(filePath: string, expectedSha512: string): Promise<boolean> {
    try {
      const actualHash = await this.computeSha512(filePath);
      return actualHash.toLowerCase() === expectedSha512.toLowerCase();
    } catch {
      return false;
    }
  }

  public async computeSha512(filePath: string): Promise<string> {
    return new Promise<string>((resolvePromise, rejectPromise) => {
      const hash = createHash('sha512');
      const stream = createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('error', (error) =>
        rejectPromise(new DownloadCacheError(`Failed to hash file "${filePath}"`, error))
      );
      stream.on('end', () => resolvePromise(hash.digest('hex')));
    });
  }

  public async invalidate(fileName: string): Promise<void> {
    const filePath = this.resolvePackagePath(fileName);
    try {
      await rm(filePath, { force: true });
    } catch (error) {
      throw new DownloadCacheError(`Failed to remove cached file "${filePath}"`, error);
    }
  }

  public async invalidatePartial(fileName: string): Promise<void> {
    const partialPath = this.resolvePartialPath(fileName);
    try {
      await rm(partialPath, { force: true });
    } catch (error) {
      throw new DownloadCacheError(`Failed to remove partial file "${partialPath}"`, error);
    }
  }

  public async listCachedFiles(): Promise<CachedPackageInfo[]> {
    try {
      await this.ensureCacheDirectory();
      const entries = await readdir(this.cacheDirectory, { withFileTypes: true });
      const files: CachedPackageInfo[] = [];

      for (const entry of entries) {
        if (!entry.isFile() || entry.name.endsWith('.partial')) continue;
        const filePath = join(this.cacheDirectory, entry.name);
        const stats = await stat(filePath);
        files.push({ fileName: entry.name, filePath, sizeBytes: stats.size });
      }

      return files;
    } catch (error) {
      throw new DownloadCacheError('Failed to list cached files', error);
    }
  }
}