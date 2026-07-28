/**
 * AuthController
 *
 * Central authentication gateway for KDOS.
 *
 * UI
 * │
 * ▼
 * AuthController
 * │
 * ├── AuthService
 * ├── AuthSessionManager
 * └── BootstrapAuthenticator
 */

import type {
  LoginRequest,
  RegisterRequest,
  AuthResult,
} from "../services/AuthService";

import { AuthService } from "../services/AuthService";
import { AuthSessionManager } from "../session/AuthSessionManager";
import type { AuthSession } from "../models/AuthSession";

export class AuthController {
  private readonly authService: AuthService;
  private readonly sessionManager: AuthSessionManager;

  public constructor(
    authService: AuthService,
    sessionManager: AuthSessionManager,
  ) {
    this.authService = authService;
    this.sessionManager = sessionManager;
  }

  /**
   * Login
   */
  public async login(
    request: LoginRequest,
  ): Promise<AuthResult<AuthSession>> {

    const result = await this.authService.login(request);

    if (result.ok) {
      this.sessionManager.set(result.value);
    }

    return result;
  }

  /**
   * Register
   */
  public async register(
    request: RegisterRequest,
  ) {
    return this.authService.register(request);
  }

  /**
   * Logout
   */
  public async logout(): Promise<void> {
    await this.sessionManager.destroy();
  }

  /**
   * Current Session
   */
  public currentSession(): AuthSession | undefined {
    return this.sessionManager.current();
  }

  /**
   * Authenticated?
   */
  public isAuthenticated(): boolean {
    return this.sessionManager.authenticated();
  }
}