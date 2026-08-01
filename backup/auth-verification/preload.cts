import { contextBridge, ipcRenderer } from "electron";

const auth = {
  register: (request: unknown) =>
    ipcRenderer.invoke("auth.register", request),

  login: (request: unknown) =>
    ipcRenderer.invoke("auth.login", request),

  logout: (sessionId: string) =>
    ipcRenderer.invoke("auth.logout", sessionId),

  validateSession: (sessionId: string) =>
    ipcRenderer.invoke("auth.session", sessionId),

  verifyEmail: (request: unknown) =>
    ipcRenderer.invoke("auth.verifyEmail", request),

  resendVerification: (email: string) =>
    ipcRenderer.invoke("auth.resendVerification", email),
};

const kdos = {
  version: process.versions.electron,
  platform: process.platform,
  auth,
};

contextBridge.exposeInMainWorld("kdos", kdos);
