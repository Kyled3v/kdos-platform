/**
 * AuthStorage
 *
 * Persists users and sessions as JSON files.
 * The IAuthStorage interface is the contract; JsonAuthStorage is the
 * current implementation. Migrating to SQLite later means writing a new
 * class that satisfies IAuthStorage — nothing else changes.
 */

import { readFile, writeFile, mkdir, readdir, unlink } from "fs/promises";
import { join } from "path";
import { AuthUser, UserId } from "../models/AuthUser";
import { AuthSession, SessionId } from "../models/AuthSession";

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IAuthStorage {
  saveUser(user: AuthUser): Promise<void>;
  loadUser(userId: UserId): Promise<AuthUser | undefined>;
  loadUserByEmail(email: string): Promise<AuthUser | undefined>;
  saveSession(session: AuthSession): Promise<void>;
  loadSession(sessionId: SessionId): Promise<AuthSession | undefined>;
  deleteSession(sessionId: SessionId): Promise<void>;
}

// ---------------------------------------------------------------------------
// Serialisation shapes
// ---------------------------------------------------------------------------

interface SerializedUser {
  readonly userId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: string;
  readonly companyId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLogin: string | null;
}

interface SerializedSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly refreshToken: string;
}

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------

function serializeUser(user: AuthUser): SerializedUser {
  return {
    userId: user.userId,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLogin:
      user.lastLogin !== undefined ? user.lastLogin.toISOString() : null,
  };
}

function deserializeUser(s: SerializedUser): AuthUser {
  return {
    userId: s.userId,
    email: s.email,
    passwordHash: s.passwordHash,
    firstName: s.firstName,
    lastName: s.lastName,
    role: s.role as AuthUser["role"],
    companyId: s.companyId,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    lastLogin: s.lastLogin !== null ? new Date(s.lastLogin) : undefined,
  };
}

function serializeSession(session: AuthSession): SerializedSession {
  return {
    sessionId: session.sessionId,
    userId: session.userId,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    refreshToken: session.refreshToken,
  };
}

function deserializeSession(s: SerializedSession): AuthSession {
  return {
    sessionId: s.sessionId,
    userId: s.userId,
    createdAt: new Date(s.createdAt),
    expiresAt: new Date(s.expiresAt),
    refreshToken: s.refreshToken,
  };
}

// ---------------------------------------------------------------------------
// JSON file helpers (each returns its own concrete type — no union leaks)
// ---------------------------------------------------------------------------

async function readUserFile(filePath: string): Promise<AuthUser | undefined> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return deserializeUser(JSON.parse(raw) as SerializedUser);
  } catch {
    return undefined;
  }
}

async function readSessionFile(filePath: string): Promise<AuthSession | undefined> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return deserializeSession(JSON.parse(raw) as SerializedSession);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// JSON implementation
// ---------------------------------------------------------------------------

export class JsonAuthStorage implements IAuthStorage {
  private readonly usersDir: string;
  private readonly sessionsDir: string;

  public constructor(storageRootPath: string) {
    this.usersDir = join(storageRootPath, "users");
    this.sessionsDir = join(storageRootPath, "sessions");
  }

  public async saveUser(user: AuthUser): Promise<void> {
    await mkdir(this.usersDir, { recursive: true });
    await writeFile(
      this.userPath(user.userId),
      JSON.stringify(serializeUser(user), null, 2),
      "utf-8"
    );
  }

  public async loadUser(userId: UserId): Promise<AuthUser | undefined> {
    return readUserFile(this.userPath(userId));
  }

  public async loadUserByEmail(email: string): Promise<AuthUser | undefined> {
    let fileNames: string[];

    try {
      fileNames = await readdir(this.usersDir);
    } catch {
      return undefined;
    }

    const normalised = email.toLowerCase().trim();

    for (const fileName of fileNames) {
      const user = await readUserFile(join(this.usersDir, fileName));

      if (user !== undefined && user.email.toLowerCase() === normalised) {
        return user;
      }
    }

    return undefined;
  }

  public async saveSession(session: AuthSession): Promise<void> {
    await mkdir(this.sessionsDir, { recursive: true });
    await writeFile(
      this.sessionPath(session.sessionId),
      JSON.stringify(serializeSession(session), null, 2),
      "utf-8"
    );
  }

  public async loadSession(sessionId: SessionId): Promise<AuthSession | undefined> {
    return readSessionFile(this.sessionPath(sessionId));
  }

  public async deleteSession(sessionId: SessionId): Promise<void> {
    try {
      await unlink(this.sessionPath(sessionId));
    } catch {
      // Session file may already be absent — not an error.
    }
  }

  private userPath(userId: UserId): string {
    return join(this.usersDir, `${userId}.json`);
  }

  private sessionPath(sessionId: SessionId): string {
    return join(this.sessionsDir, `${sessionId}.json`);
  }
}