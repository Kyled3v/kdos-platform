/**
 * KDOS Authentication Bridge
 *
 * Typed contract between the React renderer and Electron preload.
 */

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: "Admin" | "Manager" | "Operator" | "Viewer";
  readonly companyId: string;
}

export interface AuthSessionResponse {
  readonly sessionId: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly refreshToken: string;
}

export interface AuthUserResponse {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: "Admin" | "Manager" | "Operator" | "Viewer";
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

export type AuthResult<T> = AuthSuccess<T> | AuthFailure;

export interface AuthBridge {
  readonly login: (
    request: LoginRequest
  ) => Promise<AuthResult<AuthSessionResponse>>;

  readonly register: (
    request: RegisterRequest
  ) => Promise<AuthResult<AuthUserResponse>>;

  readonly logout: (
    sessionId: string
  ) => Promise<void>;

  readonly validateSession: (
    sessionId: string
  ) => Promise<AuthResult<AuthSessionResponse>>;
}

export interface KdosBridge {
  readonly version: string;
  readonly platform: NodeJS.Platform;
  readonly auth: AuthBridge;
}
