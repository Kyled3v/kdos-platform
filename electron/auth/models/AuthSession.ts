/**
 * AuthSession
 *
 * Represents an authenticated user session.
 * Expiry is evaluated at runtime via isExpired().
 */

import { UserId } from "./AuthUser.js";

export type SessionId = string;

export interface AuthSession {
  readonly sessionId: SessionId;
  readonly userId: UserId;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly refreshToken: string;
}

export function isExpired(session: AuthSession, now: Date = new Date()): boolean {
  return now >= session.expiresAt;
}