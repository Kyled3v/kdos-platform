import type {
  Company,
  CompanyId,
  Department,
  DepartmentId,
  Location,
  LocationId,
} from "../models/Company";

export interface CreateCompanyRequest {
  readonly name: string;
  readonly legalName: string;
  readonly registrationNumber?: string;
  readonly email: string;
  readonly phone: string;
  readonly website?: string;
}

export interface CreateDepartmentRequest {
  readonly companyId: CompanyId;
  readonly name: string;
  readonly description?: string;
}

export interface CreateLocationRequest {
  readonly companyId: CompanyId;
  readonly name: string;
  readonly address: string;
  readonly city: string;
  readonly province: string;
  readonly country: string;
}

export class CompanyService {
  private company: Company | null = null;
  private readonly departments: Department[] = [];
  private readonly locations: Location[] = [];

  public createCompany(
    request: CreateCompanyRequest,
  ): Company {
    if (this.company !== null) {
      throw new Error("A company is already configured.");
    }

    const now = new Date().toISOString();

    const company: Company = {
      companyId: crypto.randomUUID(),
      name: request.name.trim(),
      legalName: request.legalName.trim(),
      registrationNumber:
        request.registrationNumber?.trim() || null,
      email: request.email.trim(),
      phone: request.phone.trim(),
      website: request.website?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    this.company = company;

    return company;
  }

  public getCompany(): Company | null {
    return this.company;
  }

  public updateCompany(
    updates: Partial<
      Pick<
        Company,
        | "name"
        | "legalName"
        | "registrationNumber"
        | "email"
        | "phone"
        | "website"
      >
    >,
  ): Company {
    if (this.company === null) {
      throw new Error("Company has not been configured.");
    }

    this.company = {
      ...this.company,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.company;
  }

  public createDepartment(
    request: CreateDepartmentRequest,
  ): Department {
    const now = new Date().toISOString();

    const department: Department = {
      departmentId: crypto.randomUUID() as DepartmentId,
      companyId: request.companyId,
      name: request.name.trim(),
      description: request.description?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    };

    this.departments.push(department);

    return department;
  }

  public listDepartments(
    companyId: CompanyId,
  ): Department[] {
    return this.departments.filter(
      (department) => department.companyId === companyId,
    );
  }

  public createLocation(
    request: CreateLocationRequest,
  ): Location {
    const now = new Date().toISOString();

    const location: Location = {
      locationId: crypto.randomUUID() as LocationId,
      companyId: request.companyId,
      name: request.name.trim(),
      address: request.address.trim(),
      city: request.city.trim(),
      province: request.province.trim(),
      country: request.country.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.locations.push(location);

    return location;
  }

  public listLocations(
    companyId: CompanyId,
  ): Location[] {
    return this.locations.filter(
      (location) => location.companyId === companyId,
    );
  }
}
