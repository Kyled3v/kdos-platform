/**
 * src/platform/update/download/DownloadProgress.ts
 *
 * Canonical progress model for the KDOS update downloader.
 * Supersedes the earlier root-level DownloadProgress.ts.
 *
 * No HTTP. No file I/O. No UI. Pure data and calculation.
 */

// ---------------------------------------------------------------------------
// Snapshot — immutable point-in-time view emitted to listeners
// ---------------------------------------------------------------------------

export interface DownloadProgressSnapshot {
  /** File name of the asset being downloaded. */
  readonly installerName: string;

  /** Bytes written to disk so far, including any resumed bytes. */
  readonly bytesDownloaded: number;

  /** Total expected bytes for the complete installer. 0 when unknown. */
  readonly totalBytes: number;

  /**
   * Completion percentage in the range [0, 100].
   * 0 when totalBytes is unknown.
   */
  readonly percentage: number;

  /** Current transfer rate in bytes per second, averaged over a sliding window. */
  readonly bytesPerSecond: number;

  /**
   * Estimated seconds until the download completes.
   * Null when speed is zero or totalBytes is unknown.
   */
  readonly estimatedSecondsRemaining: number | null;
}

// ---------------------------------------------------------------------------
// Listener type
// ---------------------------------------------------------------------------

export type DownloadProgressListener = (snapshot: DownloadProgressSnapshot) => void;

// ---------------------------------------------------------------------------
// Tracker — stateful, internal to UpdateDownloader
// ---------------------------------------------------------------------------

interface ProgressSample {
  readonly timestampMs: number;
  readonly bytesDownloaded: number;
}

/** Sliding-window duration used for speed calculation. */
const SPEED_WINDOW_MS = 5_000;

/**
 * Tracks byte progress for a single download and derives speed and ETA
 * using a sliding time window of samples.
 *
 * Not exported from the public surface — instantiated only by UpdateDownloader.
 */
export class DownloadProgressTracker {
  private readonly installerName: string;
  private readonly totalBytes: number;
  private bytesDownloaded: number;
  private samples: ProgressSample[];

  public constructor(installerName: string, totalBytes: number, startingBytes = 0) {
    this.installerName   = installerName;
    this.totalBytes      = totalBytes;
    this.bytesDownloaded = startingBytes;
    this.samples         = [{ timestampMs: Date.now(), bytesDownloaded: startingBytes }];
  }

  /**
   * Records a new byte count and returns the current snapshot.
   * Must be called with monotonically increasing values.
   */
  public record(bytesDownloaded: number): DownloadProgressSnapshot {
    this.bytesDownloaded = bytesDownloaded;
    const now = Date.now();
    this.samples.push({ timestampMs: now, bytesDownloaded });
    this.pruneOldSamples(now);
    return this.snapshot();
  }

  /** Returns the current snapshot without recording a new sample. */
  public snapshot(): DownloadProgressSnapshot {
    const bytesPerSecond            = this.computeBytesPerSecond();
    const remainingBytes            = Math.max(this.totalBytes - this.bytesDownloaded, 0);
    const estimatedSecondsRemaining =
      bytesPerSecond > 0 && this.totalBytes > 0
        ? remainingBytes / bytesPerSecond
        : null;

    const percentage =
      this.totalBytes > 0
        ? Math.min((this.bytesDownloaded / this.totalBytes) * 100, 100)
        : 0;

    return {
      installerName:              this.installerName,
      bytesDownloaded:            this.bytesDownloaded,
      totalBytes:                 this.totalBytes,
      percentage,
      bytesPerSecond,
      estimatedSecondsRemaining,
    };
  }

  private computeBytesPerSecond(): number {
    if (this.samples.length < 2) return 0;

    const oldest         = this.samples[0];
    const newest         = this.samples[this.samples.length - 1];
    const elapsedSeconds = (newest.timestampMs - oldest.timestampMs) / 1_000;

    if (elapsedSeconds <= 0) return 0;

    return (newest.bytesDownloaded - oldest.bytesDownloaded) / elapsedSeconds;
  }

  private pruneOldSamples(now: number): void {
    const cutoff = now - SPEED_WINDOW_MS;
    while (this.samples.length > 2 && this.samples[0].timestampMs < cutoff) {
      this.samples.shift();
    }
  }
}