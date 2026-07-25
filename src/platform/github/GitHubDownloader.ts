import { createWriteStream } from 'fs';
import { rename, stat } from 'fs/promises';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import type { ReadableStream as NodeWebReadableStream } from 'stream/web';

import { GitHubReleaseAsset } from './GitHubAssets';
import { DownloadCache } from './DownloadCache';
import { DownloadProgressListener, DownloadProgressTracker } from './DownloadProgress';

export interface GitHubDownloaderConfig {
  readonly userAgent: string;
  readonly token?: string;
  readonly cache?: DownloadCache;
  readonly progressThrottleMs?: number;
}

export interface DownloadAssetOptions {
  readonly asset: GitHubReleaseAsset;
  readonly expectedSha512: string;
  readonly onProgress?: DownloadProgressListener;
  readonly signal?: AbortSignal;
}

export interface DownloadAssetResult {
  readonly filePath: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly resumed: boolean;
}

export class GitHubDownloaderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'GitHubDownloaderError';
  }
}

const DEFAULT_PROGRESS_THROTTLE_MS = 200;

/**
 * Downloads GitHub release assets into the on-disk cache directory
 * (storage/cache/), supporting resumable downloads via HTTP Range requests
 * and post-download SHA-512 validation.
 */
export class GitHubDownloader {
  private readonly userAgent: string;
  private readonly token: string | undefined;
  private readonly cache: DownloadCache;
  private readonly progressThrottleMs: number;

  constructor(config: GitHubDownloaderConfig) {
    this.userAgent = config.userAgent;
    this.token = config.token;
    this.cache = config.cache ?? new DownloadCache();
    this.progressThrottleMs = config.progressThrottleMs ?? DEFAULT_PROGRESS_THROTTLE_MS;
  }

  public async download(options: DownloadAssetOptions): Promise<DownloadAssetResult> {
    const { asset, expectedSha512, onProgress, signal } = options;

    await this.cache.ensureCacheDirectory();

    const alreadyCached = await this.cache.has(asset.name, expectedSha512);
    if (alreadyCached) {
      const finalPath = this.cache.resolvePackagePath(asset.name);
      const stats = await stat(finalPath);
      return { filePath: finalPath, fileName: asset.name, sizeBytes: stats.size, resumed: false };
    }

    const partialPath = this.cache.resolvePartialPath(asset.name);
    const finalPath = this.cache.resolvePackagePath(asset.name);

    const existingPartial = await this.cache.findPartial(asset.name);
    const startingBytes = existingPartial?.sizeBytes ?? 0;

    const response = await this.requestAsset(asset, startingBytes, signal);
    const resumed = response.status === 206 && startingBytes > 0;
    const actualStartingBytes = resumed ? startingBytes : 0;

    if (!resumed && existingPartial !== null) {
      await this.cache.invalidatePartial(asset.name);
    }

    const totalBytes = this.resolveTotalBytes(response, actualStartingBytes);
    const tracker = new DownloadProgressTracker(asset.name, totalBytes, actualStartingBytes);

    await this.streamToDisk({
      response,
      partialPath,
      append: resumed,
      tracker,
      onProgress,
    });

    const isValid = await this.cache.validate(partialPath, expectedSha512);
    if (!isValid) {
      await this.cache.invalidatePartial(asset.name);
      throw new GitHubDownloaderError(`Downloaded package "${asset.name}" failed SHA-512 validation`);
    }

    try {
      await rename(partialPath, finalPath);
    } catch (error) {
      throw new GitHubDownloaderError(`Failed to finalize downloaded package "${asset.name}"`, error);
    }

    const stats = await stat(finalPath);
    return { filePath: finalPath, fileName: asset.name, sizeBytes: stats.size, resumed };
  }

  private async requestAsset(
    asset: GitHubReleaseAsset,
    startingBytes: number,
    signal?: AbortSignal
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/octet-stream',
      'User-Agent': this.userAgent,
    };

    if (this.token !== undefined) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    if (startingBytes > 0) {
      headers.Range = `bytes=${startingBytes}-`;
    }

    let response: Response;
    try {
      response = await fetch(asset.downloadUrl, { headers, signal });
    } catch (error) {
      throw new GitHubDownloaderError(`Failed to request asset "${asset.name}"`, error);
    }

    if (!response.ok && response.status !== 206) {
      throw new GitHubDownloaderError(
        `Failed to download asset "${asset.name}" with status ${response.status} ${response.statusText}`
      );
    }

    if (response.body === null) {
      throw new GitHubDownloaderError(`Asset "${asset.name}" response had no body`);
    }

    return response;
  }

  private resolveTotalBytes(response: Response, startingBytes: number): number {
    const contentRange = response.headers.get('content-range');
    if (contentRange !== null) {
      const match = /\/(\d+)$/.exec(contentRange);
      if (match !== null) {
        return Number.parseInt(match[1], 10);
      }
    }

    const contentLength = response.headers.get('content-length');
    const parsedLength = contentLength !== null ? Number.parseInt(contentLength, 10) : NaN;

    if (Number.isNaN(parsedLength)) {
      return startingBytes;
    }

    return response.status === 206 ? startingBytes + parsedLength : parsedLength;
  }

  private async streamToDisk(params: {
    response: Response;
    partialPath: string;
    append: boolean;
    tracker: DownloadProgressTracker;
    onProgress?: DownloadProgressListener;
  }): Promise<void> {
    const { response, partialPath, append, tracker, onProgress } = params;

    if (response.body === null) {
      throw new GitHubDownloaderError('Response body was null during streaming');
    }

    const sourceStream = Readable.fromWeb(
      response.body as unknown as NodeWebReadableStream<Uint8Array>
    );
    const destinationStream = createWriteStream(partialPath, {
      flags: append ? 'a' : 'w',
    });

    let downloadedBytes = tracker.snapshot().bytesDownloaded;
    let lastEmitMs = 0;

    sourceStream.on('data', (chunk: Buffer) => {
      downloadedBytes += chunk.length;
      const now = Date.now();
      if (onProgress !== undefined && now - lastEmitMs >= this.progressThrottleMs) {
        lastEmitMs = now;
        onProgress(tracker.record(downloadedBytes));
      }
    });

    try {
      await pipeline(sourceStream, destinationStream);
    } catch (error) {
      throw new GitHubDownloaderError(`Failed while streaming asset to "${partialPath}"`, error);
    }

    if (onProgress !== undefined) {
      onProgress(tracker.record(downloadedBytes));
    }
  }
}