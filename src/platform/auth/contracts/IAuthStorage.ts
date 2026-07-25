/**
 * IAuthStorage.ts
 *
 * Production contract for KDOS authentication persistence.
 *
 * Storage target: local SQLite database accessed from the Electron main process.
 *
 * All methods are async to remain compatible with the SQLite driver.
 * No SQL, ORM types, or driver-specific concerns appear at this boundary.
 */

import type { Session, SessionProvider } from './ISessionManager';

// ---------------------------------------------------------------------------
// Stored record types
// ---------------------------------------------------------------------------

export interface StoredUser {
  /** Stable, globally unique user identifier (UUID v4 recommended). */
  readonly id: string;

  /** Unique email address. Used as the login credential for local accounts. */
  readonly email: string;

  /** Display name. Not used for authentication. */
  readonly displayName: string;

  /**
   * Argon2id/bcrypt hash of the user's password.
   * Null for SSO-only accounts that have never set a local password.
   */
  readonly passwordHash: string | null;

  /** ISO-8601 UTC timestamp of account creation. */
  readonly createdAt: string;

  /** ISO-8601 UTC timestamp of the most recent profile update. */
  readonly updatedAt: string;

  /** When set, the account is suspended and must not be authenticated. */
  readonly lockedAt: string | null;
}

export interface StoredSsoIdentity {
  /** Stable identifier assigned by this storage layer. */
  readonly id: string;

  /** The KDOS user this SSO identity belongs to. */
  readonly userId: string;

  /** The SSO provider that issued this identity. */
  readonly provider: Exclude<SessionProvider, 'local'>;

  /** The subject identifier issued by the SSO provider (e.g. `sub` claim). */
  readonly providerUserId: string;

  /** ISO-8601 UTC timestamp of when this identity was first linked. */
  readonly linkedAt: string;
}

export interface StoredSession extends Session {
  /** ISO-8601 UTC timestamp of when this session was revoked, if applicable. */
  readonly revokedAt: string | null;
}

// ---------------------------------------------------------------------------
// Query / filter types
// ---------------------------------------------------------------------------

export interface UserLookupByEmail {
  readonly email: string;
}

export interface UserLookupById {
  readonly id: string;
}

export interface SsoIdentityLookup {
  readonly provider: Exclude<SessionProvider, 'local'>;
  readonly providerUserId: string;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IAuthStorage {
  // ------------------------------------------------------------------
  // User records
  // ------------------------------------------------------------------

  /**
   * Persists a new user record.
   *
   * @param user - The full user record to insert (id must be pre-assigned).
   * @throws     If a user with the same id or email already exists.
   */
  createUser(user: StoredUser): Promise<void>;

  /**
   * Retrieves a user by their unique identifier.
   *
   * @param lookup - Object containing the target user id.
   * @returns      The stored user, or null if not found.
   */
  findUserById(lookup: UserLookupById): Promise<StoredUser | null>;

  /**
   * Retrieves a user by their email address.
   *
   * @param lookup - Object containing the target email address.
   * @returns      The stored user, or null if not found.
   */
  findUserByEmail(lookup: UserLookupByEmail): Promise<StoredUser | null>;

  /**
   * Applies a partial update to an existing user record.
   * Only the supplied fields are modified; all others are preserved.
   *
   * @param id      - The id of the user to update.
   * @param changes - Partial record of fields to overwrite.
   * @throws        If no user with the given id exists.
   */
  updateUser(id: string, changes: Partial<Omit<StoredUser, 'id' | 'createdAt'>>): Promise<void>;

  /**
   * Permanently deletes a user record and all associated data.
   * Must cascade to SSO identities and sessions.
   *
   * @param id - The id of the user to delete.
   * @throws   If no user with the given id exists.
   */
  deleteUser(id: string): Promise<void>;

  // ------------------------------------------------------------------
  // SSO identities
  // ------------------------------------------------------------------

  /**
   * Persists a new SSO identity linked to an existing user.
   *
   * @param identity - The full SSO identity record to insert.
   * @throws         If the provider + providerUserId combination already exists.
   */
  createSsoIdentity(identity: StoredSsoIdentity): Promise<void>;

  /**
   * Retrieves an SSO identity by provider and provider-issued subject id.
   *
   * @param lookup - Provider and providerUserId to look up.
   * @returns      The stored identity, or null if not found.
   */
  findSsoIdentity(lookup: SsoIdentityLookup): Promise<StoredSsoIdentity | null>;

  /**
   * Returns all SSO identities linked to the given KDOS user.
   *
   * @param userId - The KDOS user id.
   * @returns      Array of linked SSO identities, empty if none.
   */
  listSsoIdentitiesForUser(userId: string): Promise<StoredSsoIdentity[]>;

  /**
   * Removes a specific SSO identity without affecting other identities or the
   * user record itself.
   *
   * @param id - The SSO identity record id to remove.
   * @throws   If no identity with the given id exists.
   */
  deleteSsoIdentity(id: string): Promise<void>;

  // ------------------------------------------------------------------
  // Sessions
  // ------------------------------------------------------------------

  /**
   * Persists a new session record.
   *
   * @param session - The full session record to insert.
   * @throws        If a session with the same id already exists.
   */
  createSession(session: StoredSession): Promise<void>;

  /**
   * Retrieves a session by its unique identifier.
   *
   * @param sessionId - The session id to look up.
   * @returns         The stored session, or null if not found.
   */
  findSession(sessionId: string): Promise<StoredSession | null>;

  /**
   * Retrieves a session by its refresh token.
   *
   * @param refreshToken - The refresh token to look up.
   * @returns            The stored session, or null if not found.
   */
  findSessionByRefreshToken(refreshToken: string): Promise<StoredSession | null>;

  /**
   * Returns all non-revoked sessions for the given user.
   *
   * @param userId - The KDOS user id.
   * @returns      Array of active sessions, empty if none.
   */
  listActiveSessionsForUser(userId: string): Promise<StoredSession[]>;

  /**
   * Marks a session as revoked by recording its revokedAt timestamp.
   * Must be idempotent — calling on an already-revoked session must not throw.
   *
   * @param sessionId - The session id to revoke.
   * @param revokedAt - ISO-8601 UTC timestamp of revocation.
   */
  revokeSession(sessionId: string, revokedAt: string): Promise<void>;

  /**
   * Revokes all active sessions belonging to the given user.
   *
   * @param userId    - The KDOS user id.
   * @param revokedAt - ISO-8601 UTC timestamp applied to all revoked sessions.
   * @returns         The number of sessions revoked.
   */
  revokeAllSessionsForUser(userId: string, revokedAt: string): Promise<number>;
}