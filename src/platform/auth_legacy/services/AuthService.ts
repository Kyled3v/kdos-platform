/**
 * AuthService
 *
 * Implements register, login, logout, and session validation.
 * Depends on IAuthStorage (injected), PasswordHasher functions, and
 * PasswordPolicy — no concrete storage class is referenced here.
 */

import { randomUUID } from "crypto";
import { AuthUser, UserId, UserRole, CompanyId, updateLastLogin } from "../models/AuthUser";
import { AuthSession, SessionId, isExpired } from "../models/AuthSession";
import { hashPassword, verifyPassword } from "../security/PasswordHasher";
import { validatePassword, PasswordPolicyOptions, DEFAULT_PASSWORD_POLICY } from "../security/PasswordPolicy";
import { IAuthStorage } from "../storage/AuthStorage";

// ---------------------------------------------------------------------------
// Request / result types
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly companyId: CompanyId;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export type AuthSuccess<T> = { readonly ok: true; readonly value: T };
export type AuthFailure = { readonly ok: false; readonly reason: string };
export type AuthResult<T> = AuthSuccess<T> | AuthFailure;

function succeed<T>(value: T): AuthSuccess<T> {
  return { ok: true, value };
}

function fail(reason: string): AuthFailure {
  return { ok: false, reason };
}

export interface AuthServiceOptions {
  readonly sessionTtlMs: number;
  readonly passwordPolicy: PasswordPolicyOptions;
}

const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1_000; // 8 hours

export const DEFAULT_AUTH_SERVICE_OPTIONS: AuthServiceOptions = {
  sessionTtlMs: DEFAULT_SESSION_TTL_MS,
  passwordPolicy: DEFAULT_PASSWORD_POLICY,
};

// ---------------------------------------------------------------------------
// AuthService
// ---------------------------------------------------------------------------

export class AuthService {
  private readonly storage: IAuthStorage;
  private readonly options: AuthServiceOptions;

  public constructor(
    storage: IAuthStorage,
    options: AuthServiceOptions = DEFAULT_AUTH_SERVICE_OPTIONS
  ) {
    this.storage = storage;
    this.options = options;
  }

  public async register(
    request: RegisterRequest
  ): Promise<AuthResult<AuthUser>> {
    const policyResult = validatePassword(
      request.password,
      this.options.passwordPolicy
    );

    if (!policyResult.valid) {
      return fail(policyResult.violations.join(" "));
    }

    const existing = await this.storage.loadUserByEmail(request.email);

    if (existing !== undefined) {
      return fail("An account with this email address already exists.");
    }

    const now = new Date();
    const passwordHash = await hashPassword(request.password);

    const user: AuthUser = {
      userId: randomUUID() as UserId,
      email: request.email.toLowerCase().trim(),
      passwordHash,
      firstName: request.firstName,
      lastName: request.lastName,
      role: request.role,
      companyId: request.companyId,
      createdAt: now,
      updatedAt: now,
      lastLogin: undefined,
    };

    await this.storage.saveUser(user);

    return succeed(user);
  }

  public async login(
    request: LoginRequest
  ): Promise<AuthResult<AuthSession>> {
    const user = await this.storage.loadUserByEmail(request.email);

    if (user === undefined) {
      return fail("Invalid email address or password.");
    }

    const passwordValid = await verifyPassword(
      request.password,
      user.passwordHash
    );

    if (!passwordValid) {
      return fail("Invalid email address or password.");
    }

    const now = new Date();
    const updatedUser = updateLastLogin(user, now);
    await this.storage.saveUser(updatedUser);

    const session: AuthSession = {
      sessionId: randomUUID() as SessionId,
      userId: user.userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.options.sessionTtlMs),
      refreshToken: randomUUID(),
    };

    await this.storage.saveSession(session);

    return succeed(session);
  }

  public async logout(sessionId: SessionId): Promise<void> {
    await this.storage.deleteSession(sessionId);
  }

  public async validateSession(
    sessionId: SessionId
  ): Promise<AuthResult<AuthSession>> {
    const session = await this.storage.loadSession(sessionId);

    if (session === undefined) {
      return fail("Session not found.");
    }

    if (isExpired(session)) {
      await this.storage.deleteSession(sessionId);
      return fail("Session has expired.");
    }

    return succeed(session);
  }
}