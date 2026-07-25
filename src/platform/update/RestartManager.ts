/**
 * RestartManager
 *
 * Coordinates a graceful KDOS restart after a successful update
 * installation. The sequence is:
 *
 *   1. Persist the RestartRequest to disk
 *   2. Notify all registered shutdown listeners
 *   3. Invoke the Electron gateway to schedule app.relaunch()
 *   4. Invoke the Electron gateway to call app.exit(0)
 *
 * On the next launch, the caller should call restoreSession() which
 * reads the persisted request, generates a RestartReport, and clears
 * the pending request file.
 *
 * RestartManager contains no Electron imports. All platform-specific
 * calls are delegated to ElectronRestartGateway so the class remains
 * testable without a live Electron environment.
 */

import { RestartRequest, serializeRestartRequest, deserializeRestartRequest } from "./RestartRequest";
import { RestartState } from "./RestartState";
import {
  RestartReport,
  RestartError,
  buildSuccessfulRestartReport,
  buildFailedRestartReport,
} from "./RestartReport";

export interface ElectronRestartGateway {
  /** Schedules the application to relaunch on the next exit. */
  scheduleRelaunch(): void;
  /** Terminates the current process immediately with the given exit code. */
  exitProcess(code: number): void;
}

export interface RestartStorageGateway {
  writeTextFile(absoluteFilePath: string, contents: string): Promise<void>;
  readTextFile(absoluteFilePath: string): Promise<string>;
  fileExists(absoluteFilePath: string): Promise<boolean>;
  deleteFile(absoluteFilePath: string): Promise<void>;
}

export type ShutdownListener = () => Promise<void>;

export interface RestartManagerOptions {
  readonly pendingRestartFilePath: string;
}

export class RestartManager {
  private readonly electron: ElectronRestartGateway;
  private readonly storage: RestartStorageGateway;
  private readonly options: RestartManagerOptions;
  private readonly shutdownListeners: ShutdownListener[];

  private state: RestartState;

  public constructor(
    electron: ElectronRestartGateway,
    storage: RestartStorageGateway,
    options: RestartManagerOptions
  ) {
    this.electron = electron;
    this.storage = storage;
    this.options = options;
    this.shutdownListeners = [];
    this.state = "Pending";
  }

  public registerShutdownListener(listener: ShutdownListener): void {
    this.shutdownListeners.push(listener);
  }

  public getState(): RestartState {
    return this.state;
  }

  public async restart(request: RestartRequest): Promise<void> {
    this.state = "Restarting";

    await this.persistRestartRequest(request);
    await this.notifyShutdownListeners();

    this.electron.scheduleRelaunch();
    this.electron.exitProcess(0);
  }

  public async restoreSession(): Promise<RestartReport | undefined> {
    const pendingExists = await this.storage.fileExists(
      this.options.pendingRestartFilePath
    );

    if (!pendingExists) {
      return undefined;
    }

    const startedAt = Date.now();
    const errors: RestartError[] = [];
    let request: RestartRequest;

    try {
      const json = await this.storage.readTextFile(this.options.pendingRestartFilePath);
      request = deserializeRestartRequest(json);
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      const parseError: RestartError = {
        code: "RESTART_REQUEST_PARSE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to parse the persisted restart request.",
      };

      this.state = "Failed";

      return buildFailedRestartReport("unknown", "unknown", durationMs, [parseError]);
    }

    try {
      await this.storage.deleteFile(this.options.pendingRestartFilePath);
    } catch (error) {
      errors.push({
        code: "RESTART_REQUEST_CLEANUP_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete the persisted restart request file.",
      });
    }

    const durationMs = Date.now() - startedAt;

    if (errors.length > 0) {
      this.state = "Failed";

      return buildFailedRestartReport(
        request.currentVersion,
        request.targetVersion,
        durationMs,
        errors
      );
    }

    this.state = "Completed";

    return buildSuccessfulRestartReport(
      request.currentVersion,
      request.targetVersion,
      durationMs
    );
  }

  private async persistRestartRequest(request: RestartRequest): Promise<void> {
    await this.storage.writeTextFile(
      this.options.pendingRestartFilePath,
      serializeRestartRequest(request)
    );
  }

  private async notifyShutdownListeners(): Promise<void> {
    for (const listener of this.shutdownListeners) {
      await listener();
    }
  }
}