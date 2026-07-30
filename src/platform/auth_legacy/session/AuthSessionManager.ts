/**
 * AuthSessionManager
 *
 * Central session controller for KDOS.
 *
 * Responsible for:
 * - Restoring sessions
 * - Persisting sessions
 * - Destroying sessions
 * - Exposing the current authenticated session
 *
 * No UI.
 */

import type { SessionId, AuthSession } from "../models/AuthSession";
import type { IAuthStorage } from "../storage/AuthStorage";

export class AuthSessionManager {
  private readonly storage: IAuthStorage;

  private currentSession: AuthSession | undefined;

  public constructor(storage: IAuthStorage) {
    this.storage = storage;
  }

  public async restore(
    sessionId: SessionId,
  ): Promise<AuthSession | undefined> {
    const session = await this.storage.loadSession(sessionId);

    if (session === undefined) {
      this.currentSession = undefined;
      return undefined;
    }

    this.currentSession = session;

    return session;
  }

  public current(): AuthSession | undefined {
    return this.currentSession;
  }

  public authenticated(): boolean {
    return this.currentSession !== undefined;
  }

  public async destroy(): Promise<void> {
    if (this.currentSession === undefined) {
      return;
    }

    await this.storage.deleteSession(
      this.currentSession.sessionId,
    );

    this.currentSession = undefined;
  }

  public set(session: AuthSession): void {
    this.currentSession = session;
  }
}