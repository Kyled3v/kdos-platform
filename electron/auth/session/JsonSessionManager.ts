import { AuthSession } from "../models/AuthSession";
import { SessionManager } from "./SessionManager";

export class JsonSessionManager implements SessionManager {
  private currentSession: AuthSession | null = null;

  async createSession(session: AuthSession): Promise<void> {
    this.currentSession = session;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    return this.currentSession;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    if (
      this.currentSession &&
      this.currentSession.sessionId === sessionId
    ) {
      this.currentSession = null;
    }
  }

  async invalidateAllSessions(userId: string): Promise<void> {
    if (
      this.currentSession &&
      this.currentSession.userId === userId
    ) {
      this.currentSession = null;
    }
  }

  async refreshSession(session: AuthSession): Promise<void> {
    this.currentSession = session;
  }

  async validateSession(sessionId: string): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    if (this.currentSession.sessionId !== sessionId) {
      return false;
    }

    return this.currentSession.expiresAt > new Date();
  }
}