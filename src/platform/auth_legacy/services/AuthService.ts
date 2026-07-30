import type { AuthSession } from "../models/AuthSession";
import type { AuthUser, CompanyId, UserId, UserRole } from "../models/AuthUser";

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

export interface AuthService {
  register(request: RegisterRequest): Promise<AuthResult<AuthUser>>;
  login(request: LoginRequest): Promise<AuthResult<AuthSession>>;
  logout(sessionId: string): Promise<void>;
  validateSession(sessionId: string): Promise<AuthResult<AuthSession>>;
}

declare global {
  interface Window {
    kdos: {
      auth: {
        register(request: RegisterRequest): Promise<AuthResult<AuthUser>>;
        login(request: LoginRequest): Promise<AuthResult<AuthSession>>;
        logout(sessionId: string): Promise<void>;
        validateSession(sessionId: string): Promise<AuthResult<AuthSession>>;
      };
      version: string;
      platform: NodeJS.Platform;
    };
  }
}

export class RendererAuthService implements AuthService {
  public register(
    request: RegisterRequest
  ): Promise<AuthResult<AuthUser>> {
    return window.kdos.auth.register(request);
  }

  public login(
    request: LoginRequest
  ): Promise<AuthResult<AuthSession>> {
    return window.kdos.auth.login(request);
  }

  public logout(sessionId: string): Promise<void> {
    return window.kdos.auth.logout(sessionId);
  }

  public validateSession(
    sessionId: string
  ): Promise<AuthResult<AuthSession>> {
    return window.kdos.auth.validateSession(sessionId);
  }
}
