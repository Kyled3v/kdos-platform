/**
 * AuthUser
 *
 * Core identity record for a KDOS user.
 *
 * Passwords and verification codes are stored only as hashes.
 */

export type UserId = string;
export type CompanyId = string;

export type UserRole =
  | "Admin"
  | "Manager"
  | "Operator"
  | "Viewer";

export interface AuthUser {
  readonly userId: UserId;
  readonly email: string;
  readonly passwordHash: string;

  readonly firstName: string;
  readonly lastName: string;

  readonly role: UserRole;
  readonly companyId: CompanyId;

  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLogin: Date | undefined;

  readonly emailVerified: boolean;

  readonly verificationCodeHash: string | undefined;
  readonly verificationCodeExpiresAt: Date | undefined;
}

export function updateLastLogin(
  user: AuthUser,
  loginAt: Date,
): AuthUser {
  return {
    ...user,
    lastLogin: loginAt,
    updatedAt: loginAt,
  };
}
