/**
 * IPasswordHasher.ts
 *
 * Production contract for KDOS local-account password hashing and verification.
 *
 * This interface is intentionally scoped to local accounts only.
 * SSO flows do not pass through IPasswordHasher — they are handled
 * entirely within the SSO provider boundary via IAuthService.
 *
 * The concrete implementation is responsible for selecting and configuring
 * an appropriate algorithm (Argon2id recommended; bcrypt acceptable).
 */

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

export interface HashOptions {
  /**
   * Tuning parameters for the hashing algorithm.
   * When undefined the implementation must apply secure production defaults.
   * Callers must not depend on specific default values.
   */
  readonly tuning?: HashTuningParameters;
}

export interface HashTuningParameters {
  /**
   * Memory cost in kibibytes (Argon2) or cost factor (bcrypt).
   * Higher values increase resistance to brute-force attacks.
   */
  readonly memoryCost?: number;

  /**
   * Number of iterations / time cost.
   * Higher values increase resistance to brute-force attacks.
   */
  readonly timeCost?: number;

  /**
   * Degree of parallelism (Argon2 only).
   * Ignored by bcrypt implementations.
   */
  readonly parallelism?: number;
}

export interface PasswordStrengthResult {
  /** True when the password meets the minimum KDOS complexity policy. */
  readonly acceptable: boolean;

  /**
   * Ordered list of unmet requirements.
   * Empty when acceptable is true.
   */
  readonly violations: PasswordPolicyViolation[];
}

export type PasswordPolicyViolation =
  | 'too_short'
  | 'no_uppercase'
  | 'no_lowercase'
  | 'no_digit'
  | 'no_special_character'
  | 'commonly_used_password';

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IPasswordHasher {
  /**
   * Produces a secure, salted hash of the given plain-text password.
   * The returned string is self-describing and includes the algorithm,
   * parameters, salt, and digest — suitable for direct storage.
   *
   * @param plaintext - The raw password to hash. Must not be pre-hashed.
   * @param options   - Optional tuning parameters. Secure defaults apply.
   * @returns         A storable hash string.
   * @throws          If hashing fails due to an internal or resource error.
   */
  hash(plaintext: string, options?: HashOptions): Promise<string>;

  /**
   * Verifies a plain-text password against a stored hash.
   * Must use a constant-time comparison to prevent timing attacks.
   * Must transparently support hash migration — if the stored hash was
   * produced with weaker parameters, returns needsRehash true so the
   * caller can upgrade it transparently on next login.
   *
   * @param plaintext  - The raw password supplied by the user.
   * @param storedHash - The hash retrieved from IAuthStorage.
   * @returns          A PasswordVerificationResult describing the outcome.
   * @throws           If the stored hash is structurally invalid.
   */
  verify(plaintext: string, storedHash: string): Promise<PasswordVerificationResult>;

  /**
   * Evaluates a plain-text password against the KDOS complexity policy
   * without hashing it. Use before hashing during registration or
   * password change flows to surface requirement violations to the UI.
   *
   * @param plaintext - The raw candidate password.
   * @returns         A PasswordStrengthResult with any policy violations.
   */
  evaluateStrength(plaintext: string): PasswordStrengthResult;
}

export interface PasswordVerificationResult {
  /** True when the plaintext matches the stored hash. */
  readonly matches: boolean;

  /**
   * True when the stored hash was produced with parameters below the
   * current production defaults. The caller should re-hash and store
   * the updated hash when this is true and matches is true.
   */
  readonly needsRehash: boolean;
}