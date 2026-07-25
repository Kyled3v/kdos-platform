/**
 * Represents the owner of this KDOS installation.
 */
export interface User {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly company: string;
  readonly licenseKey: string;
}

