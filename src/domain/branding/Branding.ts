/**
 * Represents company branding applied across the KDOS shell.
 */
export interface Branding {
  readonly companyName: string;
  readonly logoPath: string | null;
  readonly theme: "dark" | "light";
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
}

