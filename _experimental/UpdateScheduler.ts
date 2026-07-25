/**
 * UpdateScheduler
 *
 * Runs an update check at application startup and subsequently every
 * 30 minutes. Prevents overlapping checks: if a check is already in
 * progress when the interval fires, the interval tick is skipped.
 */

import { UpdateService, UpdateServiceResult } from "./UpdateService";

export type UpdateSchedulerListener = (result: UpdateServiceResult) => void;

export interface UpdateSchedulerOptions {
  readonly checkIntervalMs: number;
}

const DEFAULT_CHECK_INTERVAL_MS = 30 * 60 * 1_000;

export class UpdateScheduler {
  private readonly updateService: UpdateService;
  private readonly options: UpdateSchedulerOptions;
  private readonly listeners: UpdateSchedulerListener[];

  private intervalHandle: ReturnType<typeof setInterval> | undefined;
  private checkInProgress: boolean;

  public constructor(
    updateService: UpdateService,
    options: UpdateSchedulerOptions = { checkIntervalMs: DEFAULT_CHECK_INTERVAL_MS }
  ) {
    this.updateService = updateService;
    this.options = options;
    this.listeners = [];
    this.intervalHandle = undefined;
    this.checkInProgress = false;
  }

  public onResult(listener: UpdateSchedulerListener): void {
    this.listeners.push(listener);
  }

  public start(): void {
    if (this.intervalHandle !== undefined) {
      return;
    }

    void this.runCheck();

    this.intervalHandle = setInterval(() => {
      void this.runCheck();
    }, this.options.checkIntervalMs);
  }

  public stop(): void {
    if (this.intervalHandle === undefined) {
      return;
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = undefined;
  }

  public isRunning(): boolean {
    return this.intervalHandle !== undefined;
  }

  private async runCheck(): Promise<void> {
    if (this.checkInProgress) {
      return;
    }

    this.checkInProgress = true;

    try {
      const result = await this.updateService.checkAndInstall();
      this.notifyListeners(result);
    } finally {
      this.checkInProgress = false;
    }
  }

  private notifyListeners(result: UpdateServiceResult): void {
    for (const listener of this.listeners) {
      listener(result);
    }
  }
}