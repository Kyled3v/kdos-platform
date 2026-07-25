/**
 * Represents one application update.
 */
export interface Update {
  readonly version: string;
  readonly build: string;
  readonly released: Date;
  readonly mandatory: boolean;
  readonly description: string;
  readonly downloaded: boolean;
  readonly installed: boolean;
}

