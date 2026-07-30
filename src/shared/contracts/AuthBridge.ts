/**
 * KDOS Authentication Bridge
 *
 * This contract defines every authentication function
 * available to the React renderer.
 *
 * The renderer MUST NEVER talk directly to Electron.
 */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  sessionId?: string;
  userId?: string;
  message?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
}

export interface AuthBridge {
  login(request: LoginRequest): Promise<LoginResponse>;

  logout(): Promise<void>;

  validateSession(): Promise<boolean>;

  register(request: RegisterRequest): Promise<boolean>;

  currentUser(): Promise<string | null>;
}