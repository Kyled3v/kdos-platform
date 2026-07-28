/**
 * BootstrapService
 *
 * Responsible for deciding how KDOS starts.
 *
 * Responsibilities:
 * - Restore previous session
 * - Decide authentication state
 * - Produce the next BootstrapState
 *
 * No UI.
 * No React.
 * Pure application logic.
 */

import {
  BootstrapState,
  INITIAL_BOOTSTRAP_STATE,
} from "../state/BootstrapState";

import { BootstrapStatus } from "../types/BootstrapStatus";

export class BootstrapService {
  public async initialise(): Promise<BootstrapState> {
    try {
      const sessionId = this.loadStoredSession();

      if (!sessionId) {
        return {
          ...INITIAL_BOOTSTRAP_STATE,
          loading: false,
          status: BootstrapStatus.UNAUTHENTICATED,
          authenticated: false,
          sessionLoaded: true,
        };
      }

      // Session validation will be implemented next.
      return {
        ...INITIAL_BOOTSTRAP_STATE,
        loading: false,
        status: BootstrapStatus.AUTHENTICATED,
        authenticated: true,
        sessionLoaded: true,
      };
    } catch (error) {
      return {
        ...INITIAL_BOOTSTRAP_STATE,
        loading: false,
        status: BootstrapStatus.FAILED,
        authenticated: false,
        sessionLoaded: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown bootstrap error.",
      };
    }
  }

  private loadStoredSession(): string | null {
    try {
      return localStorage.getItem("kdos_session");
    } catch {
      return null;
    }
  }
}