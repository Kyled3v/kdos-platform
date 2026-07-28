/**
 * BootstrapStatus
 *
 * Represents every startup state KDOS can be in while launching.
 * ApplicationBootstrap and StartupRouter both depend on this.
 */

export enum BootstrapStatus {
  INITIALISING = "INITIALISING",

  LOADING_SESSION = "LOADING_SESSION",

  AUTHENTICATED = "AUTHENTICATED",

  UNAUTHENTICATED = "UNAUTHENTICATED",

  STARTING_PLATFORM = "STARTING_PLATFORM",

  READY = "READY",

  FAILED = "FAILED",
}