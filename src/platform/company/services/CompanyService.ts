import type {
  Company,
  CompanyId,
  CreateCompanyInput,
} from "../models/Company";

export class CompanyService {
  private company: Company | null = null;

  public async createCompany(
    input: CreateCompanyInput,
  ): Promise<Company> {
    if (this.company !== null) {
      throw new Error("A company is already configured.");
    }

    const now = new Date();

    const company: Company = {
      companyId: crypto.randomUUID() as CompanyId,
      companyName: input.companyName.trim(),
      legalName: input.legalName.trim(),
      registrationNumber:
        input.registrationNumber?.trim() || null,
      vatNumber:
        input.vatNumber?.trim() || null,
      email: input.email.trim(),
      phone: input.phone.trim(),
      website:
        input.website?.trim() || null,
      address: {
        street: input.address.street.trim(),
        city: input.address.city.trim(),
        province: input.address.province.trim(),
        postalCode: input.address.postalCode.trim(),
        country: input.address.country.trim(),
      },
      logoPath: input.logoPath ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.company = company;

    return company;
  }

  public getCompany(): Company | null {
    return this.company;
  }

  public async completeOnboarding(
    input: CreateCompanyInput,
  ): Promise<Company> {
    if (this.company !== null) {
      return this.company;
    }

    return this.createCompany(input);
  }

  public updateCompany(
    updates: Partial<
      Pick<
        Company,
        | "companyName"
        | "legalName"
        | "registrationNumber"
        | "vatNumber"
        | "email"
        | "phone"
        | "website"
        | "address"
        | "logoPath"
      >
    >,
  ): Company {
    if (this.company === null) {
      throw new Error(
        "Company has not been configured.",
      );
    }

    this.company = {
      ...this.company,
      ...updates,
      updatedAt: new Date(),
    };

    return this.company;
  }
}
