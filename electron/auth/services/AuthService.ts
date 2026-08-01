/**
 * KDOS Electron AuthService
 *
 * Main-process authentication service.
 */

import { randomUUID } from "node:crypto";

import type {
  AuthUser,
  UserId,
  UserRole,
  CompanyId,
} from "../models/AuthUser.js";

import {
  markEmailVerified,
  setVerificationCode,
  updateLastLogin,
} from "../models/AuthUser.js";

import type {
  AuthSession,
  SessionId,
} from "../models/AuthSession.js";

import {
  isExpired,
} from "../models/AuthSession.js";

import {
  hashPassword,
  verifyPassword,
} from "../security/PasswordHasher.js";

import {
  validatePassword,
  DEFAULT_PASSWORD_POLICY,
  type PasswordPolicyOptions,
} from "../security/PasswordPolicy.js";

import type {
  IAuthStorage,
} from "../storage/AuthStorage.js";

import {
  createVerificationCode,
  hashVerificationCode,
  EmailVerificationService,
} from "./EmailVerificationService.js";

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

export interface AuthUserResponse {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly companyId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLogin: string | null;
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

export interface AuthServiceOptions {
  readonly sessionTtlMs: number;
  readonly passwordPolicy: PasswordPolicyOptions;
}

const DEFAULT_SESSION_TTL_MS =
  8 * 60 * 60 * 1000;

export const DEFAULT_AUTH_SERVICE_OPTIONS: AuthServiceOptions = {
  sessionTtlMs:
    DEFAULT_SESSION_TTL_MS,

  passwordPolicy:
    DEFAULT_PASSWORD_POLICY,
};

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

function toPublicUser(
  user: AuthUser,
): AuthUserResponse {
  return {
    userId: user.userId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
    createdAt:
      user.createdAt.toISOString(),
    updatedAt:
      user.updatedAt.toISOString(),
    lastLogin:
      user.lastLogin !== undefined
        ? user.lastLogin.toISOString()
        : null,
  };
}

export class AuthService {
  private readonly storage: IAuthStorage;
  private readonly options: AuthServiceOptions;
  private readonly emailService: EmailVerificationService;

  public constructor(
    storage: IAuthStorage,
    options: AuthServiceOptions =
      DEFAULT_AUTH_SERVICE_OPTIONS,
    emailService?: EmailVerificationService,
  ) {
    this.storage = storage;
    this.options = options;

    this.emailService =
      emailService ??
      new EmailVerificationService({
        apiKey:
          process.env.RESEND_API_KEY ?? "",
        fromEmail:
          process.env.RESEND_FROM_EMAIL ?? "",
      });
  }

  public async register(
    request: RegisterRequest,
  ): Promise<AuthResult<AuthUserResponse>> {
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

    if (!email) {
      return fail(
        "Email address is required.",
      );
    }

    if (!request.firstName.trim()) {
      return fail(
        "First name is required.",
      );
    }

    if (!request.lastName.trim()) {
      return fail(
        "Last name is required.",
      );
    }

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

    const verification =
      createVerificationCode();

    let user: AuthUser = {
      userId:
        randomUUID() as UserId,

      email,

      passwordHash,

      firstName:
        request.firstName.trim(),

      lastName:
        request.lastName.trim(),

      role:
        request.role,

      companyId:
        request.companyId,

      createdAt: now,
      updatedAt: now,
      lastLogin: undefined,

      emailVerified: false,

      verificationCodeHash:
        verification.hash,

      verificationCodeExpiresAt:
        verification.expiresAt,
    };

    await this.storage.saveUser(
      user,
    );

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.firstName,
        verification.code,
      );
    } catch (error) {
      console.error(
        "[KDOS] Verification email failed:",
        error,
      );

      return fail(
        error instanceof Error
          ? error.message
          : "Account created but verification email could not be sent.",
      );
    }

    return succeed(
      toPublicUser(user),
    );
  }

  public async verifyEmail(
    request: VerifyEmailRequest,
  ): Promise<AuthResult<boolean>> {
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
        "Invalid verification request.",
      );
    }

    if (user.emailVerified) {
      return succeed(true);
    }

    if (
      user.verificationCodeHash ===
      undefined ||
      user.verificationCodeExpiresAt ===
      undefined
    ) {
      return fail(
        "No active verification code exists.",
      );
    }

    if (
      new Date() >=
      user.verificationCodeExpiresAt
    ) {
      return fail(
        "Verification code has expired.",
      );
    }

    const submittedHash =
      hashVerificationCode(
        request.code,
      );

    if (
      submittedHash !==
      user.verificationCodeHash
    ) {
      return fail(
        "Invalid verification code.",
      );
    }

    const verified =
      markEmailVerified(user);

    await this.storage.saveUser(
      verified,
    );

    return succeed(true);
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
      return fail(
        "Unable to resend verification code.",
      );
    }

    if (user.emailVerified) {
      return succeed(true);
    }

    const verification =
      createVerificationCode();

    const updated =
      setVerificationCode(
        user,
        verification.hash,
        verification.expiresAt,
      );

    await this.storage.saveUser(
      updated,
    );

    try {
      await this.emailService.sendVerificationEmail(
        updated.email,
        updated.firstName,
        verification.code,
      );
    } catch (error) {
      console.error(
        "[KDOS] Resend verification failed:",
        error,
      );

      return fail(
        error instanceof Error
          ? error.message
          : "Unable to resend verification code.",
      );
    }

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

      createdAt:
        now,

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
