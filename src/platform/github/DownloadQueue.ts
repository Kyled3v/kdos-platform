import { EventEmitter } from 'events';

import { GitHubReleaseAsset } from './GitHubAssets';
import { DownloadAssetResult, GitHubDownloader } from './GitHubDownloader';
import { DownloadProgressSnapshot } from './DownloadProgress';

export interface DownloadJob {
  readonly id: string;
  readonly asset: GitHubReleaseAsset;
  readonly expectedSha512: string;
}

export type DownloadJobStatus = 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';

export interface DownloadJobState {
  readonly job: DownloadJob;
  readonly status: DownloadJobStatus;
  readonly progress: DownloadProgressSnapshot | null;
  readonly result: DownloadAssetResult | null;
  readonly error: Error | null;
}

interface QueuedEntry {
  readonly job: DownloadJob;
  readonly abortController: AbortController;
  status: DownloadJobStatus;
  progress: DownloadProgressSnapshot | null;
  result: DownloadAssetResult | null;
  error: Error | null;
}

/**
 * FIFO download queue that processes GitHub release asset downloads one
 * at a time using a GitHubDownloader.
 *
 * Emits: 'jobStarted', 'progress', 'jobCompleted', 'jobFailed',
 * 'jobCancelled' (each with a DownloadJobState), and 'drained' (no payload)
 * when the queue empties.
 */
export class DownloadQueue extends EventEmitter {
  private readonly downloader: GitHubDownloader;
  private readonly entries = new Map<string, QueuedEntry>();
  private readonly pendingIds: string[] = [];
  private activeId: string | null = null;
  private processing = false;

  constructor(downloader: GitHubDownloader) {
    super();
    this.downloader = downloader;
  }

  public enqueue(job: DownloadJob): DownloadJobState {
    if (this.entries.has(job.id)) {
      throw new Error(`Download job with id "${job.id}" is already queued`);
    }

    const entry: QueuedEntry = {
      job,
      abortController: new AbortController(),
      status: 'queued',
      progress: null,
      result: null,
      error: null,
    };

    this.entries.set(job.id, entry);
    this.pendingIds.push(job.id);

    void this.processQueue();

    return this.toState(entry);
  }

  public cancel(jobId: string): boolean {
    const entry = this.entries.get(jobId);
    if (entry === undefined) return false;
    if (entry.status === 'completed' || entry.status === 'failed') return false;

    entry.abortController.abort();

    if (entry.status === 'queued') {
      const pendingIndex = this.pendingIds.indexOf(jobId);
      if (pendingIndex !== -1) {
        this.pendingIds.splice(pendingIndex, 1);
      }
      entry.status = 'cancelled';
      this.emit('jobCancelled', this.toState(entry));
    }

    return true;
  }

  public getState(jobId: string): DownloadJobState | null {
    const entry = this.entries.get(jobId);
    return entry !== undefined ? this.toState(entry) : null;
  }

  public getAllStates(): DownloadJobState[] {
    return Array.from(this.entries.values()).map((entry) => this.toState(entry));
  }

  public get queueLength(): number {
    return this.pendingIds.length;
  }

  public get isProcessing(): boolean {
    return this.activeId !== null;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.pendingIds.length > 0) {
        const jobId = this.pendingIds.shift();
        if (jobId === undefined) continue;

        const entry = this.entries.get(jobId);
        if (entry === undefined || entry.status === 'cancelled') continue;

        this.activeId = jobId;
        entry.status = 'downloading';
        this.emit('jobStarted', this.toState(entry));

        try {
          const result = await this.downloader.download({
            asset: entry.job.asset,
            expectedSha512: entry.job.expectedSha512,
            signal: entry.abortController.signal,
            onProgress: (snapshot) => {
              entry.progress = snapshot;
              this.emit('progress', this.toState(entry));
            },
          });

          entry.result = result;
          entry.status = 'completed';
          this.emit('jobCompleted', this.toState(entry));
        } catch (error) {
          if (entry.abortController.signal.aborted) {
            entry.status = 'cancelled';
            this.emit('jobCancelled', this.toState(entry));
          } else {
            entry.error = error instanceof Error ? error : new Error(String(error));
            entry.status = 'failed';
            this.emit('jobFailed', this.toState(entry));
          }
        } finally {
          this.activeId = null;
        }
      }
    } finally {
      this.processing = false;
      this.emit('drained');
    }
  }

  private toState(entry: QueuedEntry): DownloadJobState {
    return {
      job: entry.job,
      status: entry.status,
      progress: entry.progress,
      result: entry.result,
      error: entry.error,
    };
  }
}