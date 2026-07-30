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

export const AUTH_STORAGE = "auth.storage";
export const SESSION_MANAGER = "auth.session";
export const AUTH_SERVICE = "auth.service";

export function bootstrapAuthentication(): void {
  container.registerSingleton(
    AUTH_STORAGE,
    () => new JsonAuthStorage("./storage")
  );

  container.registerSingleton(
    SESSION_MANAGER,
    () => new JsonSessionManager()
  );

  container.registerSingleton(
    AUTH_SERVICE,
    () =>
      new AuthService(
        container.resolve(AUTH_STORAGE),
        container.resolve(SESSION_MANAGER)
      )
  );
}