/**
 * AuthStorage
 *
 * Persists users and sessions as JSON files.
 *
 * Verification codes are stored only as hashes.
 */

import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  unlink,
} from "fs/promises";

import { join } from "path";

import {
  AuthUser,
  UserId,
} from "../models/AuthUser.js";

import {
  AuthSession,
  SessionId,
} from "../models/AuthSession.js";

export interface IAuthStorage {
  saveUser(user: AuthUser): Promise<void>;
  loadUser(userId: UserId): Promise<AuthUser | undefined>;
  loadUserByEmail(email: string): Promise<AuthUser | undefined>;

  saveSession(session: AuthSession): Promise<void>;
  loadSession(sessionId: SessionId): Promise<AuthSession | undefined>;
  deleteSession(sessionId: SessionId): Promise<void>;
}

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

  readonly emailVerified?: boolean;

  readonly verificationCodeHash?: string | null;
  readonly verificationCodeExpiresAt?: string | null;
}

interface SerializedSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly refreshToken: string;
}

function serializeUser(
  user: AuthUser,
): SerializedUser {
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
      user.lastLogin !== undefined
        ? user.lastLogin.toISOString()
        : null,

    emailVerified: user.emailVerified,

    verificationCodeHash:
      user.verificationCodeHash ?? null,

    verificationCodeExpiresAt:
      user.verificationCodeExpiresAt !== undefined
        ? user.verificationCodeExpiresAt.toISOString()
        : null,
  };
}

function deserializeUser(
  user: SerializedUser,
): AuthUser {
  return {
    userId: user.userId,
    email: user.email,
    passwordHash: user.passwordHash,

    firstName: user.firstName,
    lastName: user.lastName,

    role: user.role as AuthUser["role"],
    companyId: user.companyId,

    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),

    lastLogin:
      user.lastLogin !== null &&
      user.lastLogin !== undefined
        ? new Date(user.lastLogin)
        : undefined,

    emailVerified:
      user.emailVerified ?? false,

    verificationCodeHash:
      user.verificationCodeHash ?? undefined,

    verificationCodeExpiresAt:
      user.verificationCodeExpiresAt !== null &&
      user.verificationCodeExpiresAt !== undefined
        ? new Date(user.verificationCodeExpiresAt)
        : undefined,
  };
}

function serializeSession(
  session: AuthSession,
): SerializedSession {
  return {
    sessionId: session.sessionId,
    userId: session.userId,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    refreshToken: session.refreshToken,
  };
}

function deserializeSession(
  session: SerializedSession,
): AuthSession {
  return {
    sessionId: session.sessionId,
    userId: session.userId,
    createdAt: new Date(session.createdAt),
    expiresAt: new Date(session.expiresAt),
    refreshToken: session.refreshToken,
  };
}

async function readUserFile(
  filePath: string,
): Promise<AuthUser | undefined> {
  try {
    const raw = await readFile(
      filePath,
      "utf-8",
    );

    return deserializeUser(
      JSON.parse(raw) as SerializedUser,
    );
  } catch {
    return undefined;
  }
}

async function readSessionFile(
  filePath: string,
): Promise<AuthSession | undefined> {
  try {
    const raw = await readFile(
      filePath,
      "utf-8",
    );

    return deserializeSession(
      JSON.parse(raw) as SerializedSession,
    );
  } catch {
    return undefined;
  }
}

export class JsonAuthStorage
  implements IAuthStorage
{
  private readonly usersDir: string;
  private readonly sessionsDir: string;

  public constructor(
    storageRootPath: string,
  ) {
    this.usersDir = join(
      storageRootPath,
      "users",
    );

    this.sessionsDir = join(
      storageRootPath,
      "sessions",
    );
  }

  public async saveUser(
    user: AuthUser,
  ): Promise<void> {
    await mkdir(this.usersDir, {
      recursive: true,
    });

    await writeFile(
      this.userPath(user.userId),
      JSON.stringify(
        serializeUser(user),
        null,
        2,
      ),
      "utf-8",
    );
  }

  public async loadUser(
    userId: UserId,
  ): Promise<AuthUser | undefined> {
    return readUserFile(
      this.userPath(userId),
    );
  }

  public async loadUserByEmail(
    email: string,
  ): Promise<AuthUser | undefined> {
    let fileNames: string[];

    try {
      fileNames = await readdir(
        this.usersDir,
      );
    } catch {
      return undefined;
    }

    const normalised =
      email.toLowerCase().trim();

    for (const fileName of fileNames) {
      const user = await readUserFile(
        join(
          this.usersDir,
          fileName,
        ),
      );

      if (
        user !== undefined &&
        user.email.toLowerCase() === normalised
      ) {
        return user;
      }
    }

    return undefined;
  }

  public async saveSession(
    session: AuthSession,
  ): Promise<void> {
    await mkdir(this.sessionsDir, {
      recursive: true,
    });

    await writeFile(
      this.sessionPath(
        session.sessionId,
      ),
      JSON.stringify(
        serializeSession(session),
        null,
        2,
      ),
      "utf-8",
    );
  }

  public async loadSession(
    sessionId: SessionId,
  ): Promise<AuthSession | undefined> {
    return readSessionFile(
      this.sessionPath(sessionId),
    );
  }

  public async deleteSession(
    sessionId: SessionId,
  ): Promise<void> {
    try {
      await unlink(
        this.sessionPath(sessionId),
      );
    } catch {
      // Already absent.
    }
  }

  private userPath(
    userId: UserId,
  ): string {
    return join(
      this.usersDir,
      `${userId}.json`,
    );
  }

  private sessionPath(
    sessionId: SessionId,
  ): string {
    return join(
      this.sessionsDir,
      `${sessionId}.json`,
    );
  }
}
