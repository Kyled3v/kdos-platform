/**
 * CompanySettings
 *
 * Mutable configuration attached to a KDOS company after onboarding.
 */

import type { CompanyId } from "./Company";

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type CurrencyCode = string;
export type LanguageCode = string;

export interface CompanySettings {
  readonly companyId: CompanyId;
  readonly dateFormat: DateFormat;
  readonly currency: CurrencyCode;
  readonly language: LanguageCode;
  readonly timezone: string;
  readonly onboardingComplete: boolean;
  readonly updatedAt: Date;
}

export interface UpdateCompanySettingsInput {
  readonly dateFormat?: DateFormat;
  readonly currency?: CurrencyCode;
  readonly language?: LanguageCode;
  readonly timezone?: string;
  readonly onboardingComplete?: boolean;
}

export function defaultCompanySettings(companyId: CompanyId): CompanySettings {
  return {
    companyId,
    dateFormat: "DD/MM/YYYY",
    currency: "USD",
    language: "en",
    timezone: "UTC",
    onboardingComplete: false,
    updatedAt: new Date(),
  };
}