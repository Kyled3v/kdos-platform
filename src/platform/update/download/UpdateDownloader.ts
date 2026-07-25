/**
 * src/platform/update/download/UpdateDownloader.ts
 *
 * Production implementation of IUpdateDownloader.
 *
 * Downloads the KDOS installer from UpdateManifest.downloadUrl into a
 * temporary update directory, reporting progress and supporting cancellation.
 *
 * Networking is injected via HttpFetch — the global fetch (Node 18+ /
 * Electron main process) satisfies the interface without any adapter.
 *
 * Does NOT verify checksums.
 * Does NOT install updates.
 * Does NOT restart KDOS.
 * Does NOT call GitHub directly.
 */

import { createWriteStream }       from 'fs';
import { mkdir, rename, stat, rm } from 'fs/promises';
import { join }                    from 'path';
import { pipeline }                from 'stream/promises';
import { Readable }                from 'stream';
import type { ReadableStream as NodeWebReadableStream } from 'stream/web';

import type {
  IUpdateDownloader,
  DownloadOptions,
  HttpFetch,
} from './IUpdateDownloader';

import { DownloadProgressTracker }  from './DownloadProgress';
import { DownloadResult, DownloadError } from './DownloadResult';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface UpdateDownloaderConfig {
  /**
   * Injected HTTP fetch implementation.
   * Pass `fetch` (Node 18+ global) in production.
   */
  readonly httpFetch: HttpFetch;

  /**
   * Value sent as the User-Agent header on every request.
   * Example: "KDOS/2.1.3"
   */
  readonly userAgent: string;

  /**
   * Optional GitHub token for authenticated requests.
   * Required only when downloading from a private repository.
   */
  readonly token?: string;

  /**
   * Minimum milliseconds between progress listener invocations.
   * Defaults to 200 ms to avoid flooding the IPC channel.
   */
  readonly progressThrottleMs?: number;
}

const DEFAULT_PROGRESS_THROTTLE_MS = 200;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class UpdateDownloader implements IUpdateDownloader {
  private readonly httpFetch:           HttpFetch;
  private readonly userAgent:           string;
  private readonly token:               string | undefined;
  private readonly progressThrottleMs:  number;

  public constructor(config: UpdateDownloaderConfig) {
    if (config.userAgent.trim().length === 0) {
      throw new Error('UpdateDownloader: userAgent must not be empty');
    }

    this.httpFetch          = config.httpFetch;
    this.userAgent          = config.userAgent.trim();
    this.token              = config.token;
    this.progressThrottleMs = config.progressThrottleMs ?? DEFAULT_PROGRESS_THROTTLE_MS;
  }

  public async download(options: DownloadOptions): Promise<DownloadResult> {
    const { manifest, destinationDirectory, onProgress, signal } = options;

    await this.ensureDirectory(destinationDirectory);

    const partialPath = join(destinationDirectory, `${manifest.installerName}.partial`);
    const finalPath   = join(destinationDirectory, manifest.installerName);

    const startingBytes = await this.resolveStartingBytes(partialPath);
    const response      = await this.request(manifest.downloadUrl, startingBytes, signal);
    const resumed       = response.status === 206 && startingBytes > 0;
    const actualStart   = resumed ? startingBytes : 0;

    if (!resumed && startingBytes > 0) {
      await this.removeFile(partialPath);
    }

    const totalBytes = this.resolveTotalBytes(response, actualStart, manifest.installerSize);
    const tracker    = new DownloadProgressTracker(manifest.installerName, totalBytes, actualStart);

    await this.streamToDisk({
      response,
      partialPath,
      append: resumed,
      tracker,
      onProgress,
      signal,
    });

    await this.finalise(partialPath, finalPath);

    const sizeBytes = await this.resolveFileSize(finalPath);

    return {
      filePath:      finalPath,
      installerName: manifest.installerName,
      sizeBytes,
      resumed,
      completedAt:   new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Network
  // ---------------------------------------------------------------------------

  private async request(
    url:           string,
    startingBytes: number,
    signal?:       AbortSignal,
  ): Promise<{ ok: boolean; status: number; headers: { get(n: string): string | null }; body: ReadableStream<Uint8Array> | null }> {
    const headers = this.buildHeaders(startingBytes);

    let response: Awaited<ReturnType<HttpFetch>>;
    try {
      response = await this.httpFetch(url, { headers, signal });
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new DownloadError('cancelled', 'Download was cancelled before it began', { cause: error });
      }
      throw new DownloadError('network_error', `Network request to "${url}" failed`, { cause: error });
    }

    if (!response.ok && response.status !== 206) {
      throw new DownloadError(
        'http_error',
        `Server returned status ${response.status} for "${url}"`,
        { statusCode: response.status },
      );
    }

    if (response.body === null) {
      throw new DownloadError('network_error', `Response body was null for "${url}"`);
    }

    return response;
  }

  private buildHeaders(startingBytes: number): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept':     'application/octet-stream',
      'User-Agent': this.userAgent,
    };

    if (this.token !== undefined) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (startingBytes > 0) {
      headers['Range'] = `bytes=${startingBytes}-`;
    }

    return headers;
  }

  private resolveTotalBytes(
    response:      { status: number; headers: { get(n: string): string | null } },
    startingBytes: number,
    manifestSize:  number,
  ): number {
    // Prefer Content-Range for resumable responses: "bytes 500-999/1000"
    const contentRange = response.headers.get('content-range');
    if (contentRange !== null) {
      const match = /\/(\d+)$/.exec(contentRange);
      if (match !== null) return Number.parseInt(match[1], 10);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength !== null) {
      const parsed = Number.parseInt(contentLength, 10);
      if (!Number.isNaN(parsed)) {
        return response.status === 206 ? startingBytes + parsed : parsed;
      }
    }

    // Fall back to the size declared in the manifest — always available.
    return manifestSize;
  }

  // ---------------------------------------------------------------------------
  // Streaming
  // ---------------------------------------------------------------------------

  private async streamToDisk(params: {
    response:   { body: ReadableStream<Uint8Array> | null };
    partialPath: string;
    append:      boolean;
    tracker:     DownloadProgressTracker;
    onProgress?: import('./DownloadProgress').DownloadProgressListener;
    signal?:     AbortSignal;
  }): Promise<void> {
    const { response, partialPath, append, tracker, onProgress, signal } = params;

    if (response.body === null) {
      throw new DownloadError('network_error', 'Response body was null during streaming');
    }

    const source      = Readable.fromWeb(response.body as unknown as NodeWebReadableStream<Uint8Array>);
    const destination = createWriteStream(partialPath, { flags: append ? 'a' : 'w' });

    let bytesDownloaded = tracker.snapshot().bytesDownloaded;
    let lastEmitMs      = 0;

    source.on('data', (chunk: Buffer) => {
      bytesDownloaded += chunk.length;
      const now = Date.now();
      if (onProgress !== undefined && now - lastEmitMs >= this.progressThrottleMs) {
        lastEmitMs = now;
        onProgress(tracker.record(bytesDownloaded));
      }
    });

    try {
      await pipeline(source, destination, { signal });
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new DownloadError('cancelled', 'Download was cancelled during streaming', { cause: error });
      }
      throw new DownloadError('network_error', `Stream interrupted while writing to "${partialPath}"`, { cause: error });
    }

    // Emit final 100% snapshot.
    if (onProgress !== undefined) {
      onProgress(tracker.record(bytesDownloaded));
    }
  }

  // ---------------------------------------------------------------------------
  // File system
  // ---------------------------------------------------------------------------

  private async ensureDirectory(directory: string): Promise<void> {
    try {
      await mkdir(directory, { recursive: true });
    } catch (error) {
      throw new DownloadError(
        'filesystem_error',
        `Failed to create destination directory "${directory}"`,
        { cause: error },
      );
    }
  }

  private async resolveStartingBytes(partialPath: string): Promise<number> {
    try {
      const stats = await stat(partialPath);
      return stats.isFile() ? stats.size : 0;
    } catch {
      return 0;
    }
  }

  private async finalise(partialPath: string, finalPath: string): Promise<void> {
    try {
      await rename(partialPath, finalPath);
    } catch (error) {
      throw new DownloadError(
        'filesystem_error',
        `Failed to move partial file to final path "${finalPath}"`,
        { cause: error },
      );
    }
  }

  private async resolveFileSize(filePath: string): Promise<number> {
    try {
      const stats = await stat(filePath);
      return stats.size;
    } catch (error) {
      throw new DownloadError(
        'filesystem_error',
        `Failed to stat completed installer at "${filePath}"`,
        { cause: error },
      );
    }
  }

  private async removeFile(filePath: string): Promise<void> {
    try {
      await rm(filePath, { force: true });
    } catch (error) {
      throw new DownloadError(
        'filesystem_error',
        `Failed to remove stale partial file "${filePath}"`,
        { cause: error },
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private isAbortError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.name === 'AbortError' || (error as NodeJS.ErrnoException).code === 'ABORT_ERR')
    );
  }
}