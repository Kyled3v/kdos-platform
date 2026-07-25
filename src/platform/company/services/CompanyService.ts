/**
 * CompanyService
 *
 * Creates companies, persists them, manages settings, and marks
 * onboarding complete. All storage I/O is delegated to ICompanyStorage.
 */

import { randomUUID } from "crypto";
import type { Company, CompanyId, CreateCompanyInput } from "../models/Company";
import type { CompanySettings } from "../models/CompanySettings";
import { defaultCompanySettings } from "../models/CompanySettings";
import type { ICompanyStorage } from "../storage/CompanyStorage";

export type CompanySuccess<T> = { readonly ok: true; readonly value: T };
export type CompanyFailure = { readonly ok: false; readonly reason: string };
export type CompanyResult<T> = CompanySuccess<T> | CompanyFailure;

function succeed<T>(value: T): CompanySuccess<T> {
  return { ok: true, value };
}

function fail(reason: string): CompanyFailure {
  return { ok: false, reason };
}

export interface OnboardingResult {
  readonly company: Company;
  readonly settings: CompanySettings;
}

export class CompanyService {
  private readonly storage: ICompanyStorage;

  public constructor(storage: ICompanyStorage) {
    this.storage = storage;
  }

  public async createCompany(
    input: CreateCompanyInput
  ): Promise<CompanyResult<Company>> {
    if (input.companyName.trim().length === 0) {
      return fail("Company name is required.");
    }

    if (input.email.trim().length === 0) {
      return fail("Company email is required.");
    }

    const company: Company = {
      companyId: randomUUID() as CompanyId,
      companyName: input.companyName.trim(),
      registrationNumber: input.registrationNumber.trim(),
      vatNumber: input.vatNumber.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      address: input.address,
      logoPath: input.logoPath,
      createdAt: new Date(),
    };

    await this.storage.saveCompany(company);

    return succeed(company);
  }

  public async completeOnboarding(
    input: CreateCompanyInput
  ): Promise<CompanyResult<OnboardingResult>> {
    const companyResult = await this.createCompany(input);

    if (!companyResult.ok) {
      return fail(companyResult.reason);
    }

    const settings: CompanySettings = {
      ...defaultCompanySettings(companyResult.value.companyId),
      onboardingComplete: true,
      updatedAt: new Date(),
    };

    await this.storage.saveSettings(settings);

    return succeed({ company: companyResult.value, settings });
  }

  public async loadCompany(
    companyId: CompanyId
  ): Promise<Company | undefined> {
    return this.storage.loadCompany(companyId);
  }

  public async loadSettings(
    companyId: CompanyId
  ): Promise<CompanySettings | undefined> {
    return this.storage.loadSettings(companyId);
  }

  public async isOnboardingComplete(
    companyId: CompanyId
  ): Promise<boolean> {
    const settings = await this.storage.loadSettings(companyId);
    return settings?.onboardingComplete ?? false;
  }
}