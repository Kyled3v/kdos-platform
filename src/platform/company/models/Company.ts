/**
 * KDOS Company Domain Model
 *
 * Canonical company identity used by the company onboarding,
 * storage and operational modules.
 */

export type CompanyId = string;

export interface Address {
  readonly street: string;
  readonly city: string;
  readonly province: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface Company {
  readonly companyId: CompanyId;
  readonly companyName: string;
  readonly legalName: string;
  readonly registrationNumber: string | null;
  readonly vatNumber: string | null;
  readonly email: string;
  readonly phone: string;
  readonly website: string | null;
  readonly address: Address;
  readonly logoPath: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateCompanyInput {
  readonly companyName: string;
  readonly legalName: string;
  readonly registrationNumber?: string;
  readonly vatNumber?: string;
  readonly email: string;
  readonly phone: string;
  readonly website?: string;
  readonly address: Address;
  readonly logoPath?: string | null;
}
