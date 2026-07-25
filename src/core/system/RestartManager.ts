/**
 * RestartManager
 *
 * Responsible ONLY for restarting KDOS.
 */

export type RestartPhase =
  | "Idle"
  | "PreparingRestart"
  | "StateSaved"
  | "ProcessesClosing"
  | "Restarting"
  | "StateRestored"
  | "Failed";

export interface RestartState {
  readonly phase: RestartPhase;
  readonly reason: string;
  readonly requestedAt: Date;
}

export interface RestartResult {
  readonly successful: boolean;
  readonly finalState: RestartState;
  readonly message: string;
}

export interface RestartManager {
  prepareRestart(reason: string): Promise<RestartState>;
  saveState(state: RestartState): Promise<RestartState>;
  closeProcesses(state: RestartState): Promise<RestartState>;
  restart(state: RestartState): Promise<RestartResult>;
  restoreState(result: RestartResult): Promise<RestartState>;
}