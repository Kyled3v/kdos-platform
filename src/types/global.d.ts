export interface KdosBridge {
  readonly platform: string;
}

declare global {
  interface Window {
    kdos?: KdosBridge;
  }
}

export {};

