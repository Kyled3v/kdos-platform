/**
 * PasswordPolicy
 *
 * Enforces configurable password composition rules.
 * All rules are evaluated together; every failure is reported.
 */

export interface PasswordPolicyOptions {
  readonly minimumLength: number;
  readonly requireUppercase: boolean;
  readonly requireLowercase: boolean;
  readonly requireNumeric: boolean;
  readonly requireSpecialCharacter: boolean;
}

export interface PasswordValidationResult {
  readonly valid: boolean;
  readonly violations: ReadonlyArray<string>;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicyOptions = {
  minimumLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumeric: true,
  requireSpecialCharacter: true,
};

const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const NUMERIC_PATTERN = /[0-9]/;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

export function validatePassword(
  password: string,
  policy: PasswordPolicyOptions = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const violations: string[] = [];

  if (password.length < policy.minimumLength) {
    violations.push(
      `Password must be at least ${policy.minimumLength} characters long.`
    );
  }

  if (policy.requireUppercase && !UPPERCASE_PATTERN.test(password)) {
    violations.push("Password must contain at least one uppercase letter.");
  }

  if (policy.requireLowercase && !LOWERCASE_PATTERN.test(password)) {
    violations.push("Password must contain at least one lowercase letter.");
  }

  if (policy.requireNumeric && !NUMERIC_PATTERN.test(password)) {
    violations.push("Password must contain at least one numeric digit.");
  }

  if (
    policy.requireSpecialCharacter &&
    !SPECIAL_CHARACTER_PATTERN.test(password)
  ) {
    violations.push("Password must contain at least one special character.");
  }

  return { valid: violations.length === 0, violations };
}