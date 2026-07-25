/**
 * ApplicationLifecycle
 *
 * Coordinates the application lifecycle.
 */

export type ApplicationStatus =
  | "NotInitialized"
  | "Initializing"
  | "Starting"
  | "Ready"
  | "Sleeping"
  | "Resuming"
  | "Restarting"
  | "ShuttingDown"
  | "ShutDown";

export interface ApplicationState {
  readonly status: ApplicationStatus;
  readonly version: string;
  readonly startedAt: Date | undefined;
  readonly lastTransitionAt: Date;
}

export interface LifecycleEvent {
  readonly previousStatus: ApplicationStatus;
  readonly currentStatus: ApplicationStatus;
  readonly occurredAt: Date;
  readonly reason: string;
}

export interface ApplicationLifecycle {
  initialize(): Promise<ApplicationState>;
  startup(): Promise<ApplicationState>;
  ready(): Promise<ApplicationState>;
  sleep(): Promise<ApplicationState>;
  resume(): Promise<ApplicationState>;
  restart(): Promise<ApplicationState>;
  shutdown(): Promise<ApplicationState>;
}