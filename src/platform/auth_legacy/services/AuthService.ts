import type {
  AuthUser,
  CompanyId,
  UserRole,
} from "../models/AuthUser";
import type { AuthSession, SessionId } from "../models/AuthSession";

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

export type AuthSuccess<T> = {
  readonly ok: true;
  readonly value: T;
};

export type AuthFailure = {
  readonly ok: false;
  readonly reason: string;
};

export type AuthResult<T> = AuthSuccess<T> | AuthFailure;

interface AuthUserResponse {
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

interface AuthSessionResponse {
  readonly sessionId: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly refreshToken: string;
}

function mapUser(user: AuthUserResponse): AuthUser {
  return {
    userId: user.userId,
    email: user.email,
    passwordHash: "",
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
    lastLogin:
      user.lastLogin === null ? undefined : new Date(user.lastLogin),
  };
}

function mapSession(session: AuthSessionResponse): AuthSession {
  return {
    sessionId: session.sessionId as SessionId,
    userId: session.userId,
    createdAt: new Date(session.createdAt),
    expiresAt: new Date(session.expiresAt),
    refreshToken: session.refreshToken,
  };
}

export class AuthService {
  public async register(
    request: RegisterRequest
  ): Promise<AuthResult<AuthUser>> {
    const result = await window.kdos.auth.register(request);

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      value: mapUser(result.value),
    };
  }

  public async login(
    request: LoginRequest
  ): Promise<AuthResult<AuthSession>> {
    const result = await window.kdos.auth.login(request);

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      value: mapSession(result.value),
    };
  }

  public async logout(sessionId: string): Promise<void> {
    await window.kdos.auth.logout(sessionId);
  }

  public async validateSession(
    sessionId: string
  ): Promise<AuthResult<AuthSession>> {
    const result = await window.kdos.auth.validateSession(sessionId);

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      value: mapSession(result.value),
    };
  }
}

export { AuthService as RendererAuthService };
