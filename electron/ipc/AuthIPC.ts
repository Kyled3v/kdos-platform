import { ipcMain } from "electron";
import { container } from "../core/ServiceContainer.js";
import { AUTH_SERVICE } from "../core/AuthBootstrap.js";

function getAuthService() {
  return container.resolve<any>(AUTH_SERVICE);
}

export function registerAuthIPC(): void {
  ipcMain.removeHandler("auth.register");
  ipcMain.removeHandler("auth.login");
  ipcMain.removeHandler("auth.logout");
  ipcMain.removeHandler("auth.session");

  ipcMain.handle("auth.register", async (_event, request) => {
    try {
      console.log("[IPC] auth.register", {
        email: request?.email,
      });

      const result = await getAuthService().register(request);

      console.log("[IPC] auth.register result", result);

      return result;
    } catch (error) {
      console.error("[IPC] auth.register failed", error);

      return {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Account registration failed.",
      };
    }
  });

  ipcMain.handle("auth.login", async (_event, request) => {
    try {
      console.log("[IPC] auth.login", {
        email: request?.email,
      });

      const result = await getAuthService().login(request);

      console.log("[IPC] auth.login result", result);

      return result;
    } catch (error) {
      console.error("[IPC] auth.login failed", error);

      return {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Login failed.",
      };
    }
  });

  ipcMain.handle("auth.logout", async (_event, sessionId: string) => {
    try {
      await getAuthService().logout(sessionId);

      return {
        ok: true,
      };
    } catch (error) {
      console.error("[IPC] auth.logout failed", error);

      return {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Logout failed.",
      };
    }
  });

  ipcMain.handle(
    "auth.session",
    async (_event, sessionId: string) => {
      try {
        return await getAuthService().validateSession(sessionId);
      } catch (error) {
        console.error("[IPC] auth.session failed", error);

        return {
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Session validation failed.",
        };
      }
    },
  );
}
