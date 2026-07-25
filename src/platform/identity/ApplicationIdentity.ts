/**
 * ApplicationIdentity.ts
 *
 * Location: src/platform/identity/ApplicationIdentity.ts
 *
 * Represents the installed KDOS application itself, as distinct from
 * BrandProfile (the company using it): what is installed, which
 * build, which release channel, and which workspace is currently
 * active. Types only.
 */

export type ReleaseChannel = 'stable' | 'beta' | 'dev'

export interface ApplicationIdentity {
  readonly applicationName: string
  readonly version: string
  readonly buildNumber: string
  readonly installDate: string
  readonly installationId: string
  readonly releaseChannel: ReleaseChannel
  readonly currentWorkspace: string
}
