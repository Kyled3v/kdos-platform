/**
 * ShutdownManager
 *
 * Responsible ONLY for shutting down KDOS safely.
 */

export type ShutdownPhase =
  | "Idle"
  | "PreparingShutdown"
  | "ClosingModules"
  | "FlushingStorage"
  | "ShutDown"
  | "Failed";

export interface ShutdownState {
  readonly phase: ShutdownPhase;
  readonly reason: string;
  readonly requestedAt: Date;
}

export interface ShutdownResult {
  readonly successful: boolean;
  readonly finalState: ShutdownState;
  readonly message: string;
}

export interface ShutdownManager {
  prepareShutdown(reason: string): Promise<ShutdownState>;
  closeModules(state: ShutdownState): Promise<ShutdownState>;
  flushStorage(state: ShutdownState): Promise<ShutdownState>;
  shutdown(state: ShutdownState): Promise<ShutdownResult>;
}