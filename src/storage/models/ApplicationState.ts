/**
 * ApplicationState.ts
 *
 * Location: src/storage/models/ApplicationState.ts
 *
 * The persisted state of the KDOS application itself - not any one
 * user's preferences, and not workspace content. Types only.
 *
 * NOTE ON `lastOpened`: stored as an ISO 8601 string rather than a
 * Date. JSON has no native date type - a Date survives
 * JSON.stringify only as a string, and JSON.parse never revives it
 * back into a Date automatically. Typing this field as a string
 * reflects what StorageEngine actually persists and reads back,
 * rather than implying a round-trip that does not happen.
 */

export type ApplicationChannel = 'stable' | 'beta' | 'dev'

export type ApplicationTheme = 'dark' | 'light'

export interface ApplicationState {
  readonly version: string
  readonly channel: ApplicationChannel
  readonly theme: ApplicationTheme
  readonly language: string
  readonly windowWidth: number
  readonly windowHeight: number
  readonly lastOpened: string
}

