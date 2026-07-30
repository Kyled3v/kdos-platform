import type { AuthSession, SessionId } from "../models/AuthSession";
import type { AuthUser, UserId } from "../models/AuthUser";

export interface IAuthStorage {
  saveUser(user: AuthUser): Promise<void>;
  loadUser(userId: UserId): Promise<AuthUser | undefined>;
  loadUserByEmail(email: string): Promise<AuthUser | undefined>;
  saveSession(session: AuthSession): Promise<void>;
  loadSession(sessionId: SessionId): Promise<AuthSession | undefined>;
  deleteSession(sessionId: SessionId): Promise<void>;
}

/**
 * Renderer-side storage adapter.
 *
 * The renderer never accesses the filesystem.
 * Authentication persistence belongs to Electron main process.
 */
export class JsonAuthStorage implements IAuthStorage {
  public async saveUser(_user: AuthUser): Promise<void> {
    throw new Error("Renderer storage is not available.");
  }

  public async loadUser(
    _userId: UserId
  ): Promise<AuthUser | undefined> {
    throw new Error("Renderer storage is not available.");
  }

  public async loadUserByEmail(
    _email: string
  ): Promise<AuthUser | undefined> {
    throw new Error("Renderer storage is not available.");
  }

  public async saveSession(_session: AuthSession): Promise<void> {
    throw new Error("Renderer storage is not available.");
  }

  public async loadSession(
    _sessionId: SessionId
  ): Promise<AuthSession | undefined> {
    throw new Error("Renderer storage is not available.");
  }

  public async deleteSession(
    _sessionId: SessionId
  ): Promise<void> {
    throw new Error("Renderer storage is not available.");
  }
}
