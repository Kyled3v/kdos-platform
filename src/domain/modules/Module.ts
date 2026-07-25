/**
 * Represents an installable module within KDOS.
 */
export interface Module {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly installed: boolean;
  readonly enabled: boolean;
  readonly required: boolean;
  readonly downloaded: boolean;
}

