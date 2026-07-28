/**
 * BootstrapState
 *
 * Central startup state for KDOS.
 * Everything during application startup reads or updates this object.
 */

import { BootstrapStatus } from "../types/BootstrapStatus";

export interface BootstrapState {
  readonly status: BootstrapStatus;

  readonly loading: boolean;

  readonly error?: string;

  readonly authenticated: boolean;

  readonly sessionLoaded: boolean;
}

export const INITIAL_BOOTSTRAP_STATE: BootstrapState = {
  status: BootstrapStatus.INITIALISING,

  loading: true,

  authenticated: false,

  sessionLoaded: false,

  error: undefined,
};