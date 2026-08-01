/**
 * KDOS Email Verification
 *
 * Main-process verification state.
 */

export interface EmailVerificationRecord {
  readonly email: string;
  readonly code: string;
  readonly expiresAt: Date;
  readonly verified: boolean;
}

export function createVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isVerificationExpired(
  record: EmailVerificationRecord,
  now: Date = new Date(),
): boolean {
  return now >= record.expiresAt;
}
