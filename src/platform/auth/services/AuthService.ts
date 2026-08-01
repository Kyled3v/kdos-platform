import type {
  AuthUser,
  CompanyId,
  UserRole,
} from "../models/AuthUser";

import type {
  AuthSession,
  SessionId,
} from "../models/AuthSession";

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

export interface RegistrationResult {
  readonly user: AuthUser;
  readonly email: string;
}

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

function getKdosBridge() {
  if (!window.kdos) {
    throw new Error(
      "KDOS authentication bridge is unavailable. Start the application through Electron.",
    );
  }

  if (!window.kdos.auth) {
    throw new Error(
      "KDOS authentication API is unavailable.",
    );
  }

  return window.kdos;
}

function mapUser(
  user: AuthUserResponse,
): AuthUser {
  return {
    userId: user.userId,
    email: user.email,
    passwordHash: "",
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId:
      user.companyId as CompanyId,
    createdAt:
      new Date(user.createdAt),
    updatedAt:
      new Date(user.updatedAt),
    lastLogin:
      user.lastLogin === null
        ? undefined
        : new Date(user.lastLogin),
  };
}

function mapSession(
  session: AuthSessionResponse,
): AuthSession {
  return {
    sessionId:
      session.sessionId as SessionId,
    userId:
      session.userId,
    createdAt:
      new Date(session.createdAt),
    expiresAt:
      new Date(session.expiresAt),
    refreshToken:
      session.refreshToken,
  };
}

export class AuthService {
  public async register(
    request: RegisterRequest,
  ): Promise<
    AuthResult<RegistrationResult>
  > {
    try {
      const result =
        await getKdosBridge()
          .auth
          .register(request);

      if (!result.ok) {
        return result;
      }

      const user =
        mapUser(result.value);

      return {
        ok: true,

        value: {
          user,
          email: user.email,
        },
      };
    } catch (error) {
      console.error(
        "[AUTH] Registration failed:",
        error,
      );

      return {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Registration failed.",
      };
    }
  }

  public async verifyEmail(
    request: VerifyEmailRequest,
  ): Promise<AuthResult<boolean>> {
    try {
      return await getKdosBridge()
        .auth
        .verifyEmail(request);
    } catch (error) {
      console.error(
        "[AUTH] Email verification failed:",
        error,
      );

      return {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Email verification failed.",
      };
    }
  }

  public async resendVerification(
    email: string,
  ): Promise<AuthResult<boolean>> {
    try {
      return await getKdosBridge()
        .auth
        .resendVerification(email);
    } catch (error) {
      console.error(
        "[AUTH] Resend verification failed:",
        error,
      );

      return {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to resend verification code.",
      };
    }
  }

  public async login(
    request: LoginRequest,
  ): Promise<AuthResult<AuthSession>> {
    try {
      const result =
        await getKdosBridge()
          .auth
          .login(request);

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        value:
          mapSession(result.value),
      };
    } catch (error) {
      console.error(
        "[AUTH] Login failed:",
        error,
      );

      return {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Login failed.",
      };
    }
  }

  public async logout(
    sessionId: string,
  ): Promise<void> {
    await getKdosBridge()
      .auth
      .logout(sessionId);
  }

  public async validateSession(
    sessionId: string,
  ): Promise<AuthResult<AuthSession>> {
    try {
      const result =
        await getKdosBridge()
          .auth
          .validateSession(sessionId);

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        value:
          mapSession(result.value),
      };
    } catch (error) {
      console.error(
        "[AUTH] Session validation failed:",
        error,
      );

      return {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Session validation failed.",
      };
    }
  }
}

export {
  AuthService as RendererAuthService,
};
