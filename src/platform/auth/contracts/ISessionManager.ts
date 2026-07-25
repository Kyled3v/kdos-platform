/**
 * ISessionManager.ts
 *
 * Production contract for KDOS session lifecycle management.
 *
 * The concrete Session type is defined here and imported by all
 * other authentication contracts. When the session strategy is
 * finalised (JWT, opaque token, or structured object), only this
 * file changes — all consumers remain untouched.
 */

// ---------------------------------------------------------------------------
// Session model
// Extend this record as the session strategy is finalised.
// Fields marked optional will be required once the strategy is locked.
// ---------------------------------------------------------------------------

export interface Session {
  /** Unique session identifier. Opaque to callers — treat as a handle. */
  readonly id: string;

  /** Canonical identifier of the authenticated principal. */
  readonly userId: string;

  /**
   * Provider that established this session.
   * 'local' for password-based accounts; the SSO provider key otherwise.
   */
  readonly provider: SessionProvider;

  /** ISO-8601 UTC timestamp at which the session was created. */
  readonly createdAt: string;

  /** ISO-8601 UTC timestamp after which the session must be treated as expired. */
  readonly expiresAt: string;

  /**
   * Opaque token used to obtain a new Session without re-authenticating.
   * Undefined for session strategies that do not support refresh.
   */
  readonly refreshToken?: string;

  /**
   * Raw signed token string (e.g. JWT).
   * Undefined for opaque-token strategies where the token is stored server-side.
   */
  readonly accessToken?: string;
}

export type SessionProvider = 'local' | SsoProviderKey;

/**
 * Discriminated union of supported SSO provider identifiers.
 * Extend this union as new providers are onboarded.
 */
export type SsoProviderKey = 'google' | 'microsoft' | 'okta' | 'saml';

export interface SessionValidationResult {
  readonly valid: boolean;

  /**
   * The validated session when valid is true.
   * Null when the session is expired, revoked, or not found.
   */
  readonly session: Session | null;

  /** Human-readable reason for an invalid result. Undefined when valid. */
  readonly reason?: SessionInvalidReason;
}

export type SessionInvalidReason =
  | 'not_found'
  | 'expired'
  | 'revoked'
  | 'malformed';

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface ISessionManager {
  /**
   * Creates and persists a new session for the given user and provider.
   *
   * @param userId   - Stable identifier of the authenticated user.
   * @param provider - The provider that authenticated the user.
   * @returns        The newly created Session.
   * @throws         If the session cannot be persisted.
   */
  createSession(userId: string, provider: SessionProvider): Promise<Session>;

  /**
   * Validates a session by its identifier.
   * Must check expiry, revocation status, and structural integrity.
   *
   * @param sessionId - The session identifier to validate.
   * @returns         A SessionValidationResult describing the outcome.
   */
  validateSession(sessionId: string): Promise<SessionValidationResult>;

  /**
   * Refreshes an expiring session using its refresh token, issuing a
   * new Session and invalidating the previous one atomically.
   *
   * @param refreshToken - The refresh token from the current Session.
   * @returns            A new Session with updated expiry.
   * @throws             If the refresh token is invalid, expired, or already used.
   */
  refreshSession(refreshToken: string): Promise<Session>;

  /**
   * Revokes a session immediately, preventing further use.
   * Must be idempotent — revoking an already-revoked session must not throw.
   *
   * @param sessionId - The session identifier to revoke.
   */
  revokeSession(sessionId: string): Promise<void>;

  /**
   * Revokes all active sessions for a given user.
   * Used on password change, account lockout, or administrative action.
   *
   * @param userId - The user whose sessions are to be revoked.
   * @returns      The number of sessions revoked.
   */
  revokeAllSessionsForUser(userId: string): Promise<number>;
}