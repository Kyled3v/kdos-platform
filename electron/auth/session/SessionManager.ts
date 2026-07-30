/**
 * SessionManager
 *
 * Maintains the current user session.
 */

export type SessionState =
  | "Unloaded"
  | "Loaded"
  | "Locked"
  | "Unlocked"
  | "Destroyed";

export interface Session {
  readonly sessionId: string;
  readonly userId: string;
  readonly state: SessionState;
  readonly createdAt: Date;
  readonly lastActivityAt: Date;
}

export interface SessionManager {
  load(): Promise<Session>;
  save(session: Session): Promise<void>;
  lock(session: Session): Promise<Session>;
  unlock(session: Session): Promise<Session>;
  destroy(session: Session): Promise<void>;
}