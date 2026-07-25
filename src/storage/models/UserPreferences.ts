/**
 * UserPreferences.ts
 *
 * Location: src/storage/models/UserPreferences.ts
 *
 * The persisted preferences a user has explicitly set for how KDOS
 * looks and behaves. Types only.
 */

export type PreferenceTheme = 'dark' | 'light'

export interface UserPreferences {
  readonly theme: PreferenceTheme
  readonly accentColor: string
  readonly animationsEnabled: boolean
  readonly startFullscreen: boolean
  readonly showStatusBar: boolean
}

