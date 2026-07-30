import { contextBridge, ipcRenderer } from "electron";

export interface KdosBridge {
  readonly version: string;
  readonly platform: NodeJS.Platform;

  readonly auth: {
    login(request: {
      username: string;
      password: string;
    }): Promise<{
      success: boolean;
      sessionId?: string;
      userId?: string;
      message?: string;
    }>;

    logout(): Promise<void>;

    validateSession(): Promise<boolean>;

    register(request: {
      username: string;
      password: string;
      displayName: string;
    }): Promise<boolean>;

    currentUser(): Promise<string | null>;
  };
}

const kdosBridge: KdosBridge = {
  version: process.versions.electron,
  platform: process.platform,

  auth: {
    login: (request) =>
      ipcRenderer.invoke("auth.login", request),

    logout: () =>
      ipcRenderer.invoke("auth.logout"),

    validateSession: () =>
      ipcRenderer.invoke("auth.validateSession"),

    register: (request) =>
      ipcRenderer.invoke("auth.register", request),

    currentUser: () =>
      ipcRenderer.invoke("auth.currentUser"),
  },
};

contextBridge.exposeInMainWorld("kdos", kdosBridge);
