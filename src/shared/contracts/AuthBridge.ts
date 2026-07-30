/**
 * KDOS Authentication Bridge
 *
 * Renderer-facing authentication contract.
 *
 * The renderer communicates with Electron exclusively
 * through window.kdos.auth.
 */

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly ok: boolean;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly message?: string;
  readonly reason?: string;
}

export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: "Admin" | "Manager" | "Operator" | "Viewer";
  readonly companyId: string;
}

export interface AuthBridge {
  login(request: LoginRequest): Promise<LoginResponse>;

  logout(sessionId: string): Promise<void>;

  validateSession(
    sessionId: string
  ): Promise<{
    ok: boolean;
    sessionId?: string;
    userId?: string;
    message?: string;
  }>;

  register(request: RegisterRequest): Promise<{
    ok: boolean;
    userId?: string;
    message?: string;
    reason?: string;
  }>;

  currentUser(sessionId: string): Promise<string | null>;
}
