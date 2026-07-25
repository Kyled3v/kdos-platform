/**
 * Permanent Brand model for KDOS.
 *
 * Represents the company operating this installation. `createdDate` and
 * `updatedDate` are ISO-8601 strings, matching how these values persist
 * and round-trip through serialized storage.
 */
export interface Brand {
  readonly companyName: string;
  readonly tradingName: string;
  readonly registrationNumber: string;
  readonly taxNumber: string;
  readonly logoPath: string;
  readonly theme: "dark" | "light";
  readonly createdDate: string;
  readonly updatedDate: string;
}
