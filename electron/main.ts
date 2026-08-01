/**
 * electron/main.ts
 */

import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApplicationMenu } from "./menu.js";
import { bootstrapAuthentication } from "./core/AuthBootstrap.js";
import { registerAuthIPC } from "./ipc/AuthIPC.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1400,
    minHeight: 900,
    center: true,
    resizable: true,
    show: false,
    backgroundColor: "#0A0A0B",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on(
    "preload-error",
    (_event, preloadPath, error) => {
      console.error("[KDOS] PRELOAD ERROR:", preloadPath, error);
    },
  );
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    void mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  try {
    console.log("[KDOS] Bootstrapping authentication...");
    bootstrapAuthentication();
    console.log("[KDOS] Authentication bootstrapped.");

    registerAuthIPC();
    console.log("[KDOS] Authentication IPC registered.");
  } catch (error) {
    console.error("[KDOS] Authentication bootstrap failed:", error);
    app.quit();
    return;
  }

  createApplicationMenu();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});









