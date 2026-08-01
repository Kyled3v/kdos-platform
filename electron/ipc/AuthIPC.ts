import { ipcMain } from "electron";

import {
  container,
} from "../core/ServiceContainer.js";

import {
  AUTH_SERVICE,
} from "../core/AuthBootstrap.js";

function getAuthService() {
  return container.resolve<any>(
    AUTH_SERVICE,
  );
}

export function registerAuthIPC(): void {
  const channels = [
    "auth.register",
    "auth.login",
    "auth.logout",
    "auth.session",
    "auth.verifyEmail",
    "auth.resendVerification",
  ];

  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle(
    "auth.register",
    async (_event, request) => {
      try {
        console.log(
          "[IPC] auth.register",
          {
            email: request?.email,
          },
        );

        const result =
          await getAuthService().register(
            request,
          );

        console.log(
          "[IPC] auth.register result",
          result,
        );

        return result;
      } catch (error) {
        console.error(
          "[IPC] auth.register failed",
          error,
        );

        return {
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Account registration failed.",
        };
      }
    },
  );

  ipcMain.handle(
    "auth.verifyEmail",
    async (_event, request) => {
      try {
        console.log(
          "[IPC] auth.verifyEmail",
          {
            email: request?.email,
          },
        );

        const result =
          await getAuthService().verifyEmail(
            request,
          );

        console.log(
          "[IPC] auth.verifyEmail result",
          result,
        );

        return result;
      } catch (error) {
        console.error(
          "[IPC] auth.verifyEmail failed",
          error,
        );

        return {
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Email verification failed.",
        };
      }
    },
  );

  ipcMain.handle(
    "auth.resendVerification",
    async (_event, email: string) => {
      try {
        console.log(
          "[IPC] auth.resendVerification",
          {
            email,
          },
        );

        const result =
          await getAuthService().resendVerification(
            email,
          );

        console.log(
          "[IPC] auth.resendVerification result",
          result,
        );

        return result;
      } catch (error) {
        console.error(
          "[IPC] auth.resendVerification failed",
          error,
        );

        return {
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to resend verification code.",
        };
      }
    },
  );

  ipcMain.handle(
    "auth.login",
    async (_event, request) => {
      try {
        console.log(
          "[IPC] auth.login",
          {
            email: request?.email,
          },
        );

        const result =
          await getAuthService().login(
            request,
          );

        console.log(
          "[IPC] auth.login result",
          result,
        );

        return result;
      } catch (error) {
        console.error(
          "[IPC] auth.login failed",
          error,
        );

        return {
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Login failed.",
        };
      }
    },
  );

  ipcMain.handle(
    "auth.logout",
    async (
      _event,
      sessionId: string,
    ) => {
      try {
        await getAuthService().logout(
          sessionId,
        );

        return {
          ok: true,
        };
      } catch (error) {
        console.error(
          "[IPC] auth.logout failed",
          error,
        );

        return {
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Logout failed.",
        };
      }
    },
  );

  ipcMain.handle(
    "auth.session",
    async (
      _event,
      sessionId: string,
    ) => {
      try {
        return await getAuthService()
          .validateSession(
            sessionId,
          );
      } catch (error) {
        console.error(
          "[IPC] auth.session failed",
          error,
        );

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
