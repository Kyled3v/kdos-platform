import { APP_NAME, APP_VERSION, DEFAULT_THEME } from "@/shared/constants/app";

/**
 * Typed system configuration for KDOS. Static configuration only — no
 * runtime fetching, no environment-dependent branching.
 */

export type UpdateChannel = "stable" | "beta";

export interface StorageKeyNames {
  readonly theme: string;
  readonly windowState: string;
  readonly session: string;
}

export interface SystemStartupConfig {
  readonly appName: string;
  readonly appVersion: string;
  readonly themeName: typeof DEFAULT_THEME;
}

export interface SystemConfig {
  readonly applicationId: string;
  readonly startup: SystemStartupConfig;
  readonly storageKeys: StorageKeyNames;
  readonly updateChannel: UpdateChannel;
}

export const systemConfig: SystemConfig = {
  applicationId: "com.kyledev.kdos",
  startup: {
    appName: APP_NAME,
    appVersion: APP_VERSION,
    themeName: DEFAULT_THEME,
  },
  storageKeys: {
    theme: "kdos.theme",
    windowState: "kdos.window-state",
    session: "kdos.session",
  },
  updateChannel: "stable",
};

export default systemConfig;

