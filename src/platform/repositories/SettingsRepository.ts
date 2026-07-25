import type { Settings } from "@/platform/models/Settings";

/**
 * Contract for application settings persistence. Architecture only —
 * no implementation exists yet. A future concrete repository will
 * implement this interface against an injected {@link StorageProvider},
 * matching the same interface-dependency pattern used throughout the
 * platform layer.
 */
export interface SettingsRepository {
  load(): Promise<Settings | null>;
  save(settings: Settings): Promise<void>;
  reset(): Promise<void>;
}
