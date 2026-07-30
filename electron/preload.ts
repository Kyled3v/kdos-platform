import { contextBridge, ipcRenderer } from "electron";

const auth = {
  login: (request: unknown) =>
    ipcRenderer.invoke("auth.login", request),

  register: (request: unknown) =>
    ipcRenderer.invoke("auth.register", request),

  logout: (sessionId: string) =>
    ipcRenderer.invoke("auth.logout", sessionId),

  validateSession: (sessionId: string) =>
    ipcRenderer.invoke("auth.session", sessionId),
};

const kdos = {
  version: process.versions.electron,
  platform: process.platform,
  auth,
};

contextBridge.exposeInMainWorld("kdos", kdos);
