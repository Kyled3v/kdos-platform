import { contextBridge } from "electron";

/**
 * KDOS preload bridge.
 *
 * Exposes a minimal, read-only surface to the renderer under
 * `window.kdos`. No IPC channels are wired yet — only static process
 * information is exposed.
 */
export interface KdosBridge {
  readonly version: string;
  readonly platform: NodeJS.Platform;
}

const kdosBridge: KdosBridge = {
  version: process.versions.electron,
  platform: process.platform,
};

contextBridge.exposeInMainWorld("kdos", kdosBridge);

