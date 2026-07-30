/**
 * IAuthService.ts
 *
 * Top-level production contract for the KDOS authentication platform.
 *
 * IAuthService is the single entry point for all authentication operations
 * from controllers and IPC handlers. It orchestrates IAuthStorage,
 * IPasswordHasher, and ISessionManager — no caller beneath IAuthService
 * touches those interfaces directly.
 *
 * Local accounts and SSO accounts are unified behind this interface.
 * The caller never needs to branch on provider type.
 */

import type { Session, SessionProvider, SessionValidationResult } from './ISessionManager';

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface LocalLoginRequest {
  readonly kind: 'local';
  readonly email: string;
  readonly password: string;
}

export interface SsoLoginRequest {
  readonly kind: 'sso';
  readonly provider: Exclude<SessionProvider, 'local'>;
  /**
   * The authorisation code returned by the SSO provider after the user
   * has authenticated in the provider's UI. Exchange for tokens server-side.
   */
  readonly authorizationCode: string;
  /**
   * The redirect URI that was registered with the SSO provider and used
   * when initiating the authorisation flow.
   */
  readonly redirectUri: string;
}

export type LoginRequest = LocalLoginRequest | SsoLoginRequest;

export interface LocalRegisterRequest {
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
}

export interface ChangePasswordRequest {
  readonly userId: string;
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface LinkSsoIdentityRequest {
  readonly userId: string;
  readonly provider: Exclude<SessionProvider, 'local'>;
  readonly authorizationCode: string;
  readonly redirectUri: string;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface AuthResult {
  readonly success: boolean;
  readonly session: Session | null;
  readonly user: AuthenticatedUser | null;
  readonly error: AuthError | null;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly providers: SessionProvider[];
}

export interface AuthError {
  readonly code: AuthErrorCode;
  readonly message: string;
}

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_not_found'
  | 'email_already_registered'
  | 'password_policy_violation'
  | 'sso_exchange_failed'
  | 'sso_identity_already_linked'
  | 'session_not_found'
  | 'session_expired'
  | 'session_revoked'
  | 'refresh_token_invalid'
  | 'internal_error';

export interface SsoInitiationResult {
  /**
   * The URL to which the UI must redirect the user to begin the SSO flow.
   */
  readonly authorizationUrl: string;

  /**
   * An opaque, single-use CSRF token that must be verified when the
   * provider redirects back to KDOS.
   */
  readonly state: string;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IAuthService {
  // ------------------------------------------------------------------
  // Authentication
  // ------------------------------------------------------------------

  /**
   * Authenticates a user via local credentials or an SSO authorisation code.
   * On success, creates and returns a new Session.
   *
   * For local logins, verifies the password and transparently upgrades the
   * stored hash if IPasswordHasher signals needsRehash.
   *
   * For SSO logins, exchanges the authorisation code for provider tokens,
   * resolves or provisions the linked KDOS user, and creates a session.
   *
   * @param request - A discriminated LoginRequest (local or SSO).
   * @returns       An AuthResult. Never throws for expected auth failures —
   *                failures are encoded in AuthResult.error.
   */
  login(request: LoginRequest): Promise<AuthResult>;

  /**
   * Registers a new local account and returns an active Session.
   * Validates password strength before persisting any record.
   *
   * @param request - The registration payload.
   * @returns       An AuthResult. Never throws for expected validation
   *                failures — failures are encoded in AuthResult.error.
   */
  register(request: LocalRegisterRequest): Promise<AuthResult>;

  /**
   * Revokes the given session, ending the user's authenticated context.
   * Must be idempotent.
   *
   * @param sessionId - The session to revoke.
   */
  logout(sessionId: string): Promise<void>;

  /**
   * Validates a session and returns its current state.
   * Use this on every IPC call that requires authentication.
   *
   * @param sessionId - The session identifier to validate.
   * @returns         A SessionValidationResult with the Session if valid.
   */
  validateSession(sessionId: string): Promise<SessionValidationResult>;

  /**
   * Issues a new Session from a valid refresh token, revoking the old one.
   *
   * @param refreshToken - The refresh token from the expiring Session.
   * @returns            An AuthResult with the new Session, or an error.
   */
  refreshSession(refreshToken: string): Promise<AuthResult>;

  // ------------------------------------------------------------------
  // Account management
  // ------------------------------------------------------------------

  /**
   * Changes a local account password. Verifies the current password first,
   * evaluates the new password against policy, then revokes all existing
   * sessions to force re-authentication.
   *
   * @param request - Identifiers and both passwords.
   * @returns       An AuthResult. Never throws for expected failures.
   */
  changePassword(request: ChangePasswordRequest): Promise<AuthResult>;

  // ------------------------------------------------------------------
  // SSO identity management
  // ------------------------------------------------------------------

  /**
   * Produces the provider authorisation URL and CSRF state token needed
   * to begin an SSO flow. The UI must redirect the user to the returned URL.
   *
   * @param provider    - The SSO provider to initiate.
   * @param redirectUri - The URI the provider will redirect back to.
   * @returns           The authorisation URL and CSRF state.
   */
  initiateSsoFlow(
    provider: Exclude<SessionProvider, 'local'>,
    redirectUri: string
  ): Promise<SsoInitiationResult>;

  /**
   * Links an SSO identity to an existing authenticated KDOS user account.
   * Used when a user who already has a local account wants to add SSO login.
   *
   * @param request - The userId, provider, and SSO authorisation code.
   * @returns       An AuthResult indicating success or the failure reason.
   */
  linkSsoIdentity(request: LinkSsoIdentityRequest): Promise<AuthResult>;

  /**
   * Removes a previously linked SSO identity from a user account.
   * Must refuse if the identity to unlink is the user's only authentication
   * method (i.e. no local password and no other SSO identity exists).
   *
   * @param userId   - The KDOS user id.
   * @param provider - The SSO provider to unlink.
   * @returns        An AuthResult indicating success or the failure reason.
   */
  unlinkSsoIdentity(
    userId: string,
    provider: Exclude<SessionProvider, 'local'>
  ): Promise<AuthResult>;
}