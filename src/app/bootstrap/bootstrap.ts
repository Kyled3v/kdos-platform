import { systemConfig } from "@/config/system/system.config";
import { theme, type Theme } from "@/shared/theme/theme";
import { LocalStorage } from "@/storage/local/LocalStorage";

/**
 * Result of a completed bootstrap pass, retained for callers that need
 * to confirm what configuration and theme the shell started with.
 */
export interface BootstrapResult {
  readonly appName: string;
  readonly appVersion: string;
  readonly themeName: string;
  readonly theme: Theme;
}

let bootstrapResult: BootstrapResult | null = null;

/**
 * Initializes the KDOS application shell: resolves system configuration
 * and the active theme (persisted preference if present, otherwise the
 * configured default), and persists the resolved theme back to storage
 * so subsequent launches are consistent.
 */
export async function bootstrap(): Promise<void> {
  const { startup, storageKeys } = systemConfig;

  const storedThemeName = LocalStorage.get<string>(storageKeys.theme, startup.themeName);
  const resolvedThemeName = storedThemeName === "dark" || storedThemeName === "light"
    ? storedThemeName
    : startup.themeName;

  LocalStorage.set(storageKeys.theme, resolvedThemeName);

  bootstrapResult = {
    appName: startup.appName,
    appVersion: startup.appVersion,
    themeName: resolvedThemeName,
    theme,
  };

  return Promise.resolve();
}

/**
 * Returns the result of the most recent bootstrap pass, or `null` if
 * `bootstrap()` has not yet completed.
 */
export function getBootstrapResult(): BootstrapResult | null {
  return bootstrapResult;
}

