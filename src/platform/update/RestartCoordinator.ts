/**
 * RestartCoordinator
 *
 * Responsible for saving application state ahead of a restart,
 * notifying dependent modules that a restart is imminent, requesting
 * the restart itself, and restoring state afterward.
 *
 * RestartCoordinator NEVER installs or replaces files.
 * RestartCoordinator NEVER performs the operating system process
 * restart directly; it only requests it through the injected gateway.
 */

export type RestartCoordinatorPhase =
  | "Idle"
  | "StateSaved"
  | "ModulesNotified"
  | "RestartRequested"
  | "StateRestored"
  | "Failed";

export interface ApplicationStateSnapshot {
  readonly snapshotId: string;
  readonly phase: RestartCoordinatorPhase;
  readonly capturedAt: Date;
  readonly payload: string;
}

export interface ModuleNotificationTarget {
  readonly moduleName: string;
}

export interface ModuleNotificationResult {
  readonly notifiedModules: ReadonlyArray<string>;
  readonly failedModules: ReadonlyArray<string>;
  readonly notifiedAt: Date;
}

export interface RestartRequestResult {
  readonly successful: boolean;
  readonly reason: string;
  readonly requestedAt: Date;
}

export interface StateRestorationResult {
  readonly successful: boolean;
  readonly snapshotId: string;
  readonly restoredAt: Date;
  readonly message: string;
}

export interface RestartCoordinator {
  saveApplicationState(): Promise<ApplicationStateSnapshot>;
  notifyModules(
    snapshot: ApplicationStateSnapshot,
    targets: ReadonlyArray<ModuleNotificationTarget>
  ): Promise<ModuleNotificationResult>;
  requestRestart(reason: string): Promise<RestartRequestResult>;
  restoreState(snapshot: ApplicationStateSnapshot): Promise<StateRestorationResult>;
}