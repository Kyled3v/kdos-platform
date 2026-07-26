import type { UpdateLogger } from "./UpdateLogger.js";

/**
 * Callback invoked to run a single update check — ultimately wired to
 * the UpdateDetector stage of the update pipeline by whatever composes
 * the scheduler.
 */
export type UpdateCheckTrigger = () => Promise<void>;

export interface UpdateScheduleOptions {
  readonly intervalMs: number;
}

/**
 * Drives automatic, manual, and scheduled update checks. Holds no
 * knowledge of how a check is performed — that is delegated entirely
 * to the injected {@link UpdateCheckTrigger}.
 */
export class UpdateScheduler {
  private readonly checkTrigger: UpdateCheckTrigger;
  private readonly logger: UpdateLogger | null;

  private scheduleOptions: UpdateScheduleOptions | null;
  private intervalHandle: ReturnType<typeof setInterval> | null;

  constructor(checkTrigger: UpdateCheckTrigger, logger: UpdateLogger | null = null) {
    this.checkTrigger = checkTrigger;
    this.logger = logger;
    this.scheduleOptions = null;
    this.intervalHandle = null;
  }

  /**
   * Configures the interval automatic checks run at. If checks are
   * already running, the running interval is replaced immediately.
   */
  schedule(options: UpdateScheduleOptions): void {
    if (options.intervalMs <= 0) {
      throw new Error("UpdateScheduler schedule interval must be greater than zero.");
    }

    this.scheduleOptions = options;
    this.logger?.log(`Update check schedule set to every ${options.intervalMs}ms.`);

    if (this.intervalHandle !== null) {
      this.restartInterval();
    }
  }

  /**
   * Starts automatic checks at the currently scheduled interval. Throws
   * if no schedule has been set.
   */
  start(): void {
    if (this.scheduleOptions === null) {
      throw new Error("UpdateScheduler cannot start before schedule() has been called.");
    }

    if (this.intervalHandle !== null) {
      throw new Error("UpdateScheduler is already running.");
    }

    this.restartInterval();
    this.logger?.log("Automatic update checks started.");
  }

  /**
   * Stops automatic checks. Safe to call even if not currently running.
   */
  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.logger?.log("Automatic update checks stopped.");
  }

  /**
   * Runs a single update check immediately, independent of the
   * automatic schedule.
   */
  async trigger(): Promise<void> {
    this.logger?.log("Manual update check triggered.");
    await this.checkTrigger();
  }

  private restartInterval(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
    }

    const options = this.scheduleOptions;

    if (options === null) {
      return;
    }

    this.intervalHandle = setInterval(() => {
      void this.checkTrigger();
    }, options.intervalMs);
  }
}
