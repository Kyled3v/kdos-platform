/**
 * BrandProfile.ts
 *
 * Location: src/platform/branding/BrandProfile.ts
 *
 * Represents the company operating a given KDOS installation - its
 * legal identity, registration details, and visual brand. Every
 * future module (Accounting, CRM, Inventory, HR, Payroll,
 * Manufacturing, AI Workforce, Reporting, Document Management) reads
 * this as the single source of truth for "whose data is this" and
 * "what should this look like."
 *
 * Types only - no storage, no defaults, no logic. Dates are stored as
 * ISO 8601 strings rather than Date instances: this profile is
 * intended to be persisted, and a Date does not survive a
 * JSON.stringify/JSON.parse round trip as a Date - it becomes a
 * string regardless, so the type reflects what is actually read back.
 */

export interface BrandProfile {
  readonly companyName: string
  readonly tradingName: string
  readonly registrationNumber: string
  readonly taxNumber: string
  readonly logoPath: string
  readonly primaryColor: string
  readonly secondaryColor: string
  readonly accentColor: string
  readonly createdDate: string
  readonly lastUpdated: string
}
