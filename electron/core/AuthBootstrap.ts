/**
 * AuthBootstrap.ts
 *
 * Registers all authentication services
 * into the KDOS runtime container.
 */

import { container } from "./ServiceContainer.js";

import { JsonAuthStorage } from "../auth/storage/AuthStorage.js";
import { JsonSessionManager } from "../auth/session/JsonSessionManager.js";
import { AuthService } from "../auth/services/AuthService.js";
import { EmailVerificationService } from "../auth/verification/EmailVerificationService.js";

export const AUTH_STORAGE = "auth.storage";
export const SESSION_MANAGER = "auth.session";
export const AUTH_SERVICE = "auth.service";
export const EMAIL_VERIFICATION_SERVICE =
  "auth.emailVerification";

export function bootstrapAuthentication(): void {
  container.registerSingleton(
    AUTH_STORAGE,
    () => new JsonAuthStorage("./storage"),
  );

  container.registerSingleton(
    SESSION_MANAGER,
    () =>
      new JsonSessionManager(
        container.resolve(AUTH_STORAGE),
      ),
  );

  container.registerSingleton(
    AUTH_SERVICE,
    () =>
      new AuthService(
        container.resolve(AUTH_STORAGE),
      ),
  );

  container.registerSingleton(
    EMAIL_VERIFICATION_SERVICE,
    () =>
      new EmailVerificationService(),
  );
}
