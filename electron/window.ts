import { BrowserWindow } from "electron";
import path from "node:path";

const DEVELOPMENT_SERVER_URL = "http://localhost:5173";

/**
 * Creates the main KDOS application window: a modern desktop shell with
 * a hidden title bar and dark background shown as soon as content is
 * ready, avoiding a white flash on launch.
 */
export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    title: "KDOS — Development",
    width: 1600,
    height: 950,
    minWidth: 1600,
    minHeight: 950,
    center: true,
    resizable: true,
    show: false,
    backgroundColor: "#0B0C0E",
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  // Development: the React frontend is served by the Vite dev server.
  void window.loadURL(DEVELOPMENT_SERVER_URL);

  // Production: once packaged, this will instead load the built
  // frontend from disk, e.g.:
  //   void window.loadFile(path.join(__dirname, "../dist/index.html"));
  // This switch will be wired in by an app-packaging-aware check once
  // the production build exists.

  return window;
}

