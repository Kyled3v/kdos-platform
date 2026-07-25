/**
 * Progress information and calculation utilities for in-flight downloads.
 */

export interface DownloadProgressSnapshot {
  readonly assetName: string;
  readonly bytesDownloaded: number;
  readonly totalBytes: number;
  readonly percentage: number;
  readonly bytesPerSecond: number;
  readonly estimatedSecondsRemaining: number | null;
}

interface ProgressSample {
  readonly timestampMs: number;
  readonly bytesDownloaded: number;
}

const SPEED_WINDOW_MS = 5000;

/**
 * Tracks byte progress for a single download and derives speed / ETA
 * using a sliding time window of samples.
 */
export class DownloadProgressTracker {
  private readonly assetName: string;
  private readonly totalBytes: number;
  private samples: ProgressSample[] = [];
  private bytesDownloaded = 0;

  constructor(assetName: string, totalBytes: number, startingBytes = 0) {
    this.assetName = assetName;
    this.totalBytes = totalBytes;
    this.bytesDownloaded = startingBytes;
    this.samples.push({ timestampMs: Date.now(), bytesDownloaded: startingBytes });
  }

  public record(bytesDownloaded: number): DownloadProgressSnapshot {
    this.bytesDownloaded = bytesDownloaded;
    const now = Date.now();
    this.samples.push({ timestampMs: now, bytesDownloaded });
    this.pruneOldSamples(now);
    return this.snapshot();
  }

  public snapshot(): DownloadProgressSnapshot {
    const bytesPerSecond = this.computeBytesPerSecond();
    const remainingBytes = Math.max(this.totalBytes - this.bytesDownloaded, 0);
    const estimatedSecondsRemaining =
      bytesPerSecond > 0 && this.totalBytes > 0 ? remainingBytes / bytesPerSecond : null;

    const percentage =
      this.totalBytes > 0 ? Math.min((this.bytesDownloaded / this.totalBytes) * 100, 100) : 0;

    return {
      assetName: this.assetName,
      bytesDownloaded: this.bytesDownloaded,
      totalBytes: this.totalBytes,
      percentage,
      bytesPerSecond,
      estimatedSecondsRemaining,
    };
  }

  private computeBytesPerSecond(): number {
    if (this.samples.length < 2) return 0;

    const oldest = this.samples[0];
    const newest = this.samples[this.samples.length - 1];
    const elapsedSeconds = (newest.timestampMs - oldest.timestampMs) / 1000;

    if (elapsedSeconds <= 0) return 0;

    const bytesDelta = newest.bytesDownloaded - oldest.bytesDownloaded;
    return bytesDelta / elapsedSeconds;
  }

  private pruneOldSamples(now: number): void {
    const cutoff = now - SPEED_WINDOW_MS;
    while (this.samples.length > 2 && this.samples[0].timestampMs < cutoff) {
      this.samples.shift();
    }
  }
}

export type DownloadProgressListener = (snapshot: DownloadProgressSnapshot) => void;