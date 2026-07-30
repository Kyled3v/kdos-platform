import type { Session, SessionManager } from "./SessionManager.js";

export class JsonSessionManager implements SessionManager {
  private session: Session | null = null;

  public async load(): Promise<Session> {
    if (this.session === null) {
      throw new Error("No active session.");
    }

    return this.session;
  }

  public async save(session: Session): Promise<void> {
    this.session = {
      ...session,
      state: "Loaded",
    };
  }

  public async lock(session: Session): Promise<Session> {
    const lockedSession: Session = {
      ...session,
      state: "Locked",
      lastActivityAt: new Date(),
    };

    this.session = lockedSession;

    return lockedSession;
  }

  public async unlock(session: Session): Promise<Session> {
    const unlockedSession: Session = {
      ...session,
      state: "Unlocked",
      lastActivityAt: new Date(),
    };

    this.session = unlockedSession;

    return unlockedSession;
  }

  public async destroy(session: Session): Promise<void> {
    this.session = {
      ...session,
      state: "Destroyed",
      lastActivityAt: new Date(),
    };
  }
}
