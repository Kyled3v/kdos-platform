/**
 * SettingsStore.ts
 *
 * Location: src/platform/settings/SettingsStore.ts
 *
 * The contract every settings-backed concern in KDOS depends on -
 * BrandProfile, ApplicationIdentity, and every future module's own
 * settings (Accounting, CRM, Inventory, HR, Payroll, Manufacturing,
 * AI Workforce, Reporting, Document Management) can each be served by
 * an implementation of this one generic interface, rather than each
 * module inventing its own load/save/reset shape.
 *
 * This file defines the contract only - no storage backend, no
 * default values, no concrete implementation. A future file (backed
 * by the local storage architecture, or otherwise) implements this
 * interface for a specific settings type.
 */

export interface SettingsStore<TSettings> {
  load(): Promise<TSettings>
  save(settings: TSettings): Promise<void>
  reset(): Promise<void>
}
