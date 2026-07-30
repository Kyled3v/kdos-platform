import type { AuthSession, SessionId } from "../models/AuthSession.js";
import type { IAuthStorage } from "../storage/AuthStorage.js";
import type { Session, SessionManager } from "./SessionManager.js";

export class JsonSessionManager implements SessionManager {
  private readonly storage: IAuthStorage;
  private currentSession: Session | null = null;

  public constructor(storage: IAuthStorage) {
    this.storage = storage;
  }

  public async load(): Promise<Session> {
    if (this.currentSession === null) {
      throw new Error("No active session.");
    }

    const stored = await this.storage.loadSession(
      this.currentSession.sessionId as SessionId
    );

    if (stored === undefined) {
      throw new Error("Session not found.");
    }

    this.currentSession = this.toSession(stored);

    return this.currentSession;
  }

  public async save(session: Session): Promise<void> {
    const authSession = this.toAuthSession(session);

    await this.storage.saveSession(authSession);

    this.currentSession = session;
  }

  public async lock(session: Session): Promise<Session> {
    const locked: Session = {
      ...session,
      state: "Locked",
      lastActivityAt: new Date(),
    };

    await this.save(locked);

    return locked;
  }

  public async unlock(session: Session): Promise<Session> {
    const unlocked: Session = {
      ...session,
      state: "Unlocked",
      lastActivityAt: new Date(),
    };

    await this.save(unlocked);

    return unlocked;
  }

  public async destroy(session: Session): Promise<void> {
    await this.storage.deleteSession(
      session.sessionId as SessionId
    );

    this.currentSession = null;
  }

  private toSession(session: AuthSession): Session {
    return {
      sessionId: session.sessionId,
      userId: session.userId,
      state: "Loaded",
      createdAt: session.createdAt,
      lastActivityAt: new Date(),
    };
  }

  private toAuthSession(session: Session): AuthSession {
    return {
      sessionId: session.sessionId as SessionId,
      userId: session.userId,
      createdAt: session.createdAt,
      expiresAt: new Date(
        session.lastActivityAt.getTime() + 8 * 60 * 60 * 1000
      ),
      refreshToken: "",
    };
  }
}
