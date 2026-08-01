export type CompanyId = string;
export type DepartmentId = string;
export type LocationId = string;

export interface Company {
  readonly companyId: CompanyId;
  readonly name: string;
  readonly legalName: string;
  readonly registrationNumber: string | null;
  readonly email: string;
  readonly phone: string;
  readonly website: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Department {
  readonly departmentId: DepartmentId;
  readonly companyId: CompanyId;
  readonly name: string;
  readonly description: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Location {
  readonly locationId: LocationId;
  readonly companyId: CompanyId;
  readonly name: string;
  readonly address: string;
  readonly city: string;
  readonly province: string;
  readonly country: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
