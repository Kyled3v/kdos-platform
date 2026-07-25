/**
 * Company
 *
 * Core identity record for an onboarded KDOS company.
 */

export type CompanyId = string;

export interface Address {
  readonly street: string;
  readonly city: string;
  readonly region: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface Company {
  readonly companyId: CompanyId;
  readonly companyName: string;
  readonly registrationNumber: string;
  readonly vatNumber: string;
  readonly email: string;
  readonly phone: string;
  readonly address: Address;
  readonly logoPath: string | undefined;
  readonly createdAt: Date;
}

export interface CreateCompanyInput {
  readonly companyName: string;
  readonly registrationNumber: string;
  readonly vatNumber: string;
  readonly email: string;
  readonly phone: string;
  readonly address: Address;
  readonly logoPath: string | undefined;
}