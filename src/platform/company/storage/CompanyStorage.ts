/**
 * CompanyStorage
 *
 * Persists Company and CompanySettings records as JSON files.
 * ICompanyStorage is the migration boundary — a SQLite implementation
 * replaces JsonCompanyStorage without touching anything else.
 */

import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import type { Company, CompanyId } from "../models/Company";
import type { CompanySettings } from "../models/CompanySettings";

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface ICompanyStorage {
  saveCompany(company: Company): Promise<void>;
  loadCompany(companyId: CompanyId): Promise<Company | undefined>;
  saveSettings(settings: CompanySettings): Promise<void>;
  loadSettings(companyId: CompanyId): Promise<CompanySettings | undefined>;
  deleteCompany(companyId: CompanyId): Promise<void>;
}

// ---------------------------------------------------------------------------
// Serialisation shapes (dates as ISO strings)
// ---------------------------------------------------------------------------

interface SerializedCompany {
  readonly companyId: string;
  readonly companyName: string;
  readonly registrationNumber: string;
  readonly vatNumber: string;
  readonly email: string;
  readonly phone: string;
  readonly address: {
    readonly street: string;
    readonly city: string;
    readonly region: string;
    readonly postalCode: string;
    readonly country: string;
  };
  readonly logoPath: string | null;
  readonly createdAt: string;
}

interface SerializedSettings {
  readonly companyId: string;
  readonly dateFormat: string;
  readonly currency: string;
  readonly language: string;
  readonly timezone: string;
  readonly onboardingComplete: boolean;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializeCompany(c: Company): SerializedCompany {
  return {
    companyId: c.companyId,
    companyName: c.companyName,
    registrationNumber: c.registrationNumber,
    vatNumber: c.vatNumber,
    email: c.email,
    phone: c.phone,
    address: c.address,
    logoPath: c.logoPath ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

function deserializeCompany(s: SerializedCompany): Company {
  return {
    companyId: s.companyId,
    companyName: s.companyName,
    registrationNumber: s.registrationNumber,
    vatNumber: s.vatNumber,
    email: s.email,
    phone: s.phone,
    address: s.address,
    logoPath: s.logoPath ?? undefined,
    createdAt: new Date(s.createdAt),
  };
}

function serializeSettings(s: CompanySettings): SerializedSettings {
  return {
    companyId: s.companyId,
    dateFormat: s.dateFormat,
    currency: s.currency,
    language: s.language,
    timezone: s.timezone,
    onboardingComplete: s.onboardingComplete,
    updatedAt: s.updatedAt.toISOString(),
  };
}

function deserializeSettings(s: SerializedSettings): CompanySettings {
  return {
    companyId: s.companyId,
    dateFormat: s.dateFormat as CompanySettings["dateFormat"],
    currency: s.currency,
    language: s.language,
    timezone: s.timezone,
    onboardingComplete: s.onboardingComplete,
    updatedAt: new Date(s.updatedAt),
  };
}

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// JSON implementation
// ---------------------------------------------------------------------------

export class JsonCompanyStorage implements ICompanyStorage {
  private readonly companiesDir: string;
  private readonly settingsDir: string;

  public constructor(storageRootPath: string) {
    this.companiesDir = join(storageRootPath, "companies");
    this.settingsDir = join(storageRootPath, "company-settings");
  }

  public async saveCompany(company: Company): Promise<void> {
    await mkdir(this.companiesDir, { recursive: true });
    await writeFile(
      join(this.companiesDir, `${company.companyId}.json`),
      JSON.stringify(serializeCompany(company), null, 2),
      "utf-8"
    );
  }

  public async loadCompany(companyId: CompanyId): Promise<Company | undefined> {
    const raw = await readJson<SerializedCompany>(
      join(this.companiesDir, `${companyId}.json`)
    );
    return raw !== undefined ? deserializeCompany(raw) : undefined;
  }

  public async saveSettings(settings: CompanySettings): Promise<void> {
    await mkdir(this.settingsDir, { recursive: true });
    await writeFile(
      join(this.settingsDir, `${settings.companyId}.json`),
      JSON.stringify(serializeSettings(settings), null, 2),
      "utf-8"
    );
  }

  public async loadSettings(companyId: CompanyId): Promise<CompanySettings | undefined> {
    const raw = await readJson<SerializedSettings>(
      join(this.settingsDir, `${companyId}.json`)
    );
    return raw !== undefined ? deserializeSettings(raw) : undefined;
  }

  public async deleteCompany(companyId: CompanyId): Promise<void> {
    const paths = [
      join(this.companiesDir, `${companyId}.json`),
      join(this.settingsDir, `${companyId}.json`),
    ];
    for (const p of paths) {
      try { await unlink(p); } catch { /* already absent */ }
    }
  }
}