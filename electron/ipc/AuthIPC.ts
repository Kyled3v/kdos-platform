import { ipcMain } from "electron";
import { container } from "../core/ServiceContainer.js";
import { AUTH_SERVICE } from "../core/AuthBootstrap.js";

export function registerAuthIPC(): void {
  ipcMain.handle("auth.login", async (_, request) => {
    const authService = container.resolve<any>(AUTH_SERVICE);

    return authService.login(request);
  });

  ipcMain.handle("auth.logout", async () => {
    const authService = container.resolve<any>(AUTH_SERVICE);

    return authService.logout();
  });

  ipcMain.handle("auth.validateSession", async () => {
    const authService = container.resolve<any>(AUTH_SERVICE);

    return authService.restoreSession();
  });

  ipcMain.handle("auth.register", async (_, request) => {
    const authService = container.resolve<any>(AUTH_SERVICE);

    return authService.register(request);
  });

  ipcMain.handle("auth.currentUser", async () => {
    const authService = container.resolve<any>(AUTH_SERVICE);

    return authService.currentUser();
  });
}
