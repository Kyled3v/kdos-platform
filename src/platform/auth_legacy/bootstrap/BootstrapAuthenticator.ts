/**
 * BootstrapAuthenticator
 *
 * Responsible for restoring the previous authenticated session
 * during KDOS startup.
 *
 * Flow:
 *
 * ApplicationBootstrap
 *          │
 *          ▼
 * BootstrapService
 *          │
 *          ▼
 * BootstrapAuthenticator
 *          │
 *          ▼
 * AuthSessionManager
 */

import type { SessionId, AuthSession } from "../models/AuthSession";
import { AuthSessionManager } from "../session/AuthSessionManager";

export class BootstrapAuthenticator {
  private readonly sessionManager: AuthSessionManager;

  public constructor(sessionManager: AuthSessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Attempts to restore a previous session.
   */
  public async restoreSession(
    sessionId: SessionId | null,
  ): Promise<AuthSession | undefined> {
    if (sessionId === null) {
      return undefined;
    }

    return this.sessionManager.restore(sessionId);
  }

  /**
   * Returns true if a valid authenticated session exists.
   */
  public isAuthenticated(): boolean {
    return this.sessionManager.authenticated();
  }

  /**
   * Returns the currently restored session.
   */
  public current(): AuthSession | undefined {
    return this.sessionManager.current();
  }
}