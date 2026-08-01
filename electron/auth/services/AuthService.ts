/**
 * KDOS Electron AuthService
 *
 * Main-process authentication service.
 *
 * Responsibilities:
 * - Account registration
 * - Password authentication
 * - Email verification
 * - Verification-code lifecycle
 * - Session creation
 */

import { randomUUID } from "crypto";

import {
  AuthUser,
  UserId,
  UserRole,
  CompanyId,
  updateLastLogin,
} from "../models/AuthUser.js";

import {
  AuthSession,
  SessionId,
  isExpired,
} from "../models/AuthSession.js";

import {
  hashPassword,
  verifyPassword,
} from "../security/PasswordHasher.js";

import {
  validatePassword,
  PasswordPolicyOptions,
  DEFAULT_PASSWORD_POLICY,
} from "../security/PasswordPolicy.js";

import type {
  IAuthStorage,
} from "../storage/AuthStorage.js";

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

export interface VerifyEmailRequest {
  readonly email: string;
  readonly code: string;
}

export type AuthSuccess<T> = {
  readonly ok: true;
  readonly value: T;
};

export type AuthFailure = {
  readonly ok: false;
  readonly reason: string;
};

export type AuthResult<T> =
  | AuthSuccess<T>
  | AuthFailure;

function succeed<T>(
  value: T,
): AuthSuccess<T> {
  return {
    ok: true,
    value,
  };
}

function fail(
  reason: string,
): AuthFailure {
  return {
    ok: false,
    reason,
  };
}

export interface AuthServiceOptions {
  readonly sessionTtlMs: number;
  readonly passwordPolicy: PasswordPolicyOptions;
  readonly verificationCodeTtlMs: number;
}

const DEFAULT_SESSION_TTL_MS =
  8 * 60 * 60 * 1_000;

const DEFAULT_VERIFICATION_CODE_TTL_MS =
  10 * 60 * 1_000;

export const DEFAULT_AUTH_SERVICE_OPTIONS: AuthServiceOptions = {
  sessionTtlMs:
    DEFAULT_SESSION_TTL_MS,

  passwordPolicy:
    DEFAULT_PASSWORD_POLICY,

  verificationCodeTtlMs:
    DEFAULT_VERIFICATION_CODE_TTL_MS,
};

function generateVerificationCode(): string {
  return Math.floor(
    100000 +
      Math.random() * 900000,
  ).toString();
}

export class AuthService {
  private readonly storage: IAuthStorage;
  private readonly options: AuthServiceOptions;

  public constructor(
    storage: IAuthStorage,
    options: AuthServiceOptions =
      DEFAULT_AUTH_SERVICE_OPTIONS,
  ) {
    this.storage = storage;
    this.options = options;
  }

  public async register(
    request: RegisterRequest,
  ): Promise<AuthResult<AuthUser>> {
    const policyResult =
      validatePassword(
        request.password,
        this.options.passwordPolicy,
      );

    if (!policyResult.valid) {
      return fail(
        policyResult.violations.join(" "),
      );
    }

    const email =
      request.email
        .toLowerCase()
        .trim();

    const existing =
      await this.storage.loadUserByEmail(
        email,
      );

    if (existing !== undefined) {
      return fail(
        "An account with this email address already exists.",
      );
    }

    const now = new Date();

    const passwordHash =
      await hashPassword(
        request.password,
      );

    const verificationCode =
      generateVerificationCode();

    const verificationCodeHash =
      await hashPassword(
        verificationCode,
      );

    const verificationCodeExpiresAt =
      new Date(
        now.getTime() +
          this.options.verificationCodeTtlMs,
      );

    const user: AuthUser = {
      userId:
        randomUUID() as UserId,

      email,

      passwordHash,

      firstName:
        request.firstName.trim(),

      lastName:
        request.lastName.trim(),

      role: request.role,

      companyId:
        request.companyId,

      createdAt: now,
      updatedAt: now,
      lastLogin: undefined,

      emailVerified: false,

      verificationCodeHash,

      verificationCodeExpiresAt,
    };

    await this.storage.saveUser(user);

    /*
     * Development transport.
     *
     * The real email provider will be connected after
     * the verification lifecycle is confirmed.
     */
    console.log(
      `[KDOS] Verification code for ${email}: ${verificationCode}`,
    );

    return succeed(user);
  }

  public async verifyEmail(
    request: VerifyEmailRequest,
  ): Promise<AuthResult<AuthUser>> {
    const email =
      request.email
        .toLowerCase()
        .trim();

    const code =
      request.code.trim();

    if (!/^\d{6}$/.test(code)) {
      return fail(
        "Verification code must contain 6 digits.",
      );
    }

    const user =
      await this.storage.loadUserByEmail(
        email,
      );

    if (user === undefined) {
      return fail(
        "Unable to verify this email address.",
      );
    }

    if (user.emailVerified) {
      return succeed(user);
    }

    if (
      user.verificationCodeHash === undefined ||
      user.verificationCodeExpiresAt === undefined
    ) {
      return fail(
        "No active verification code exists. Request a new code.",
      );
    }

    if (
      new Date() >=
      user.verificationCodeExpiresAt
    ) {
      return fail(
        "That verification code has expired. Request a new code.",
      );
    }

    const valid =
      await verifyPassword(
        code,
        user.verificationCodeHash,
      );

    if (!valid) {
      return fail(
        "That verification code is invalid.",
      );
    }

    const now = new Date();

    const verifiedUser: AuthUser = {
      ...user,

      emailVerified: true,

      verificationCodeHash:
        undefined,

      verificationCodeExpiresAt:
        undefined,

      updatedAt: now,
    };

    await this.storage.saveUser(
      verifiedUser,
    );

    console.log(
      `[KDOS] Email verified: ${email}`,
    );

    return succeed(
      verifiedUser,
    );
  }

  public async resendVerification(
    emailInput: string,
  ): Promise<AuthResult<boolean>> {
    const email =
      emailInput
        .toLowerCase()
        .trim();

    const user =
      await this.storage.loadUserByEmail(
        email,
      );

    if (user === undefined) {
      /*
       * Do not reveal whether an email exists.
       */
      return succeed(true);
    }

    if (user.emailVerified) {
      return fail(
        "This email address is already verified.",
      );
    }

    const verificationCode =
      generateVerificationCode();

    const verificationCodeHash =
      await hashPassword(
        verificationCode,
      );

    const verificationCodeExpiresAt =
      new Date(
        Date.now() +
          this.options.verificationCodeTtlMs,
      );

    const updatedUser: AuthUser = {
      ...user,

      verificationCodeHash,

      verificationCodeExpiresAt,

      updatedAt: new Date(),
    };

    await this.storage.saveUser(
      updatedUser,
    );

    console.log(
      `[KDOS] New verification code for ${email}: ${verificationCode}`,
    );

    return succeed(true);
  }

  public async login(
    request: LoginRequest,
  ): Promise<AuthResult<AuthSession>> {
    const email =
      request.email
        .toLowerCase()
        .trim();

    const user =
      await this.storage.loadUserByEmail(
        email,
      );

    if (user === undefined) {
      return fail(
        "Invalid email address or password.",
      );
    }

    const passwordValid =
      await verifyPassword(
        request.password,
        user.passwordHash,
      );

    if (!passwordValid) {
      return fail(
        "Invalid email address or password.",
      );
    }

    if (!user.emailVerified) {
      return fail(
        "Please verify your email address before signing in.",
      );
    }

    const now = new Date();

    const updatedUser =
      updateLastLogin(
        user,
        now,
      );

    await this.storage.saveUser(
      updatedUser,
    );

    const session: AuthSession = {
      sessionId:
        randomUUID() as SessionId,

      userId:
        user.userId,

      createdAt: now,

      expiresAt:
        new Date(
          now.getTime() +
            this.options.sessionTtlMs,
        ),

      refreshToken:
        randomUUID(),
    };

    await this.storage.saveSession(
      session,
    );

    return succeed(session);
  }

  public async logout(
    sessionId: SessionId,
  ): Promise<void> {
    await this.storage.deleteSession(
      sessionId,
    );
  }

  public async validateSession(
    sessionId: SessionId,
  ): Promise<AuthResult<AuthSession>> {
    const session =
      await this.storage.loadSession(
        sessionId,
      );

    if (session === undefined) {
      return fail(
        "Session not found.",
      );
    }

    if (isExpired(session)) {
      await this.storage.deleteSession(
        sessionId,
      );

      return fail(
        "Session has expired.",
      );
    }

    return succeed(session);
  }
}
