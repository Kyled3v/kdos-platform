/**
 * KDOS authentication storage.
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

export interface EmailVerification {
  readonly email: string;
  readonly codeHash: string;
  readonly expiresAt: Date;
}

export interface IAuthStorage {
  saveUser(user: AuthUser): Promise<void>;
  loadUser(userId: UserId): Promise<AuthUser | undefined>;
  loadUserByEmail(email: string): Promise<AuthUser | undefined>;

  saveSession(session: AuthSession): Promise<void>;
  loadSession(sessionId: SessionId): Promise<AuthSession | undefined>;
  deleteSession(sessionId: SessionId): Promise<void>;

  saveEmailVerification(
    verification: EmailVerification,
  ): Promise<void>;

  loadEmailVerification(
    email: string,
  ): Promise<EmailVerification | undefined>;

  deleteEmailVerification(
    email: string,
  ): Promise<void>;
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
}

interface SerializedSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly refreshToken: string;
}

interface SerializedEmailVerification {
  readonly email: string;
  readonly codeHash: string;
  readonly expiresAt: string;
}

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
      user.lastLogin !== undefined
        ? user.lastLogin.toISOString()
        : null,
  };
}

function deserializeUser(
  value: SerializedUser,
): AuthUser {
  return {
    userId: value.userId,
    email: value.email,
    passwordHash: value.passwordHash,
    firstName: value.firstName,
    lastName: value.lastName,
    role: value.role as AuthUser["role"],
    companyId: value.companyId,
    createdAt: new Date(value.createdAt),
    updatedAt: new Date(value.updatedAt),
    lastLogin:
      value.lastLogin !== null
        ? new Date(value.lastLogin)
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
  value: SerializedSession,
): AuthSession {
  return {
    sessionId: value.sessionId,
    userId: value.userId,
    createdAt: new Date(value.createdAt),
    expiresAt: new Date(value.expiresAt),
    refreshToken: value.refreshToken,
  };
}

function serializeVerification(
  verification: EmailVerification,
): SerializedEmailVerification {
  return {
    email: verification.email,
    codeHash: verification.codeHash,
    expiresAt: verification.expiresAt.toISOString(),
  };
}

function deserializeVerification(
  value: SerializedEmailVerification,
): EmailVerification {
  return {
    email: value.email,
    codeHash: value.codeHash,
    expiresAt: new Date(value.expiresAt),
  };
}

async function readJson<T>(
  filePath: string,
): Promise<T | undefined> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export class JsonAuthStorage
  implements IAuthStorage
{
  private readonly usersDir: string;
  private readonly sessionsDir: string;
  private readonly verificationDir: string;

  public constructor(storageRootPath: string) {
    this.usersDir = join(storageRootPath, "users");
    this.sessionsDir = join(storageRootPath, "sessions");
    this.verificationDir = join(
      storageRootPath,
      "verification",
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
    const value =
      await readJson<SerializedUser>(
        this.userPath(userId),
      );

    return value === undefined
      ? undefined
      : deserializeUser(value);
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

    const normalized =
      email.toLowerCase().trim();

    for (const fileName of fileNames) {
      const user =
        await this.loadUser(
          fileName.replace(".json", ""),
        );

      if (
        user !== undefined &&
        user.email.toLowerCase() === normalized
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
      this.sessionPath(session.sessionId),
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
    const value =
      await readJson<SerializedSession>(
        this.sessionPath(sessionId),
      );

    return value === undefined
      ? undefined
      : deserializeSession(value);
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

  public async saveEmailVerification(
    verification: EmailVerification,
  ): Promise<void> {
    await mkdir(this.verificationDir, {
      recursive: true,
    });

    await writeFile(
      this.verificationPath(
        verification.email,
      ),
      JSON.stringify(
        serializeVerification(
          verification,
        ),
        null,
        2,
      ),
      "utf-8",
    );
  }

  public async loadEmailVerification(
    email: string,
  ): Promise<EmailVerification | undefined> {
    const value =
      await readJson<SerializedEmailVerification>(
        this.verificationPath(email),
      );

    return value === undefined
      ? undefined
      : deserializeVerification(value);
  }

  public async deleteEmailVerification(
    email: string,
  ): Promise<void> {
    try {
      await unlink(
        this.verificationPath(email),
      );
    } catch {
      // Already absent.
    }
  }

  private userPath(
    userId: string,
  ): string {
    return join(
      this.usersDir,
      `${userId}.json`,
    );
  }

  private sessionPath(
    sessionId: string,
  ): string {
    return join(
      this.sessionsDir,
      `${sessionId}.json`,
    );
  }

  private verificationPath(
    email: string,
  ): string {
    const safeEmail = Buffer.from(
      email.toLowerCase().trim(),
    ).toString("base64url");

    return join(
      this.verificationDir,
      `${safeEmail}.json`,
    );
  }
}
