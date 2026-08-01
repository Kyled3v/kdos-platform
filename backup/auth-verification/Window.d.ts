/**
 * Renderer window bridge types.
 *
 * The preload script guarantees window.kdos exists before
 * the renderer application is used.
 */

import type { KdosBridge } from "./AuthBridge";

declare global {
  interface Window {
    readonly kdos: KdosBridge;
  }
}

export {};
