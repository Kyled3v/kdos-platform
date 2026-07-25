/**
 * main.ts
 *
 * Location: electron/main.ts
 *
 * The Electron main process, compiled as native ES Modules (see
 * electron/tsconfig.json: module/moduleResolution are both
 * "NodeNext"). Two things had to change from a CommonJS version to
 * run correctly as ESM:
 *
 * 1. `__dirname` does not exist in ES module scope - it is a
 *    CommonJS global. It is reconstructed below from
 *    `import.meta.url`, which is the standard ESM replacement.
 *
 * 2. Under "moduleResolution": "NodeNext", a relative import must
 *    reference the *compiled* file's extension (".js"), even though
 *    the source file on disk is "menu.ts". This is a NodeNext
 *    requirement, not a typo - `from "./menu"` will fail to resolve,
 *    `from "./menu.js"` is correct and matches what tsc actually
 *    emits into dist-electron/.
 */

import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApplicationMenu } from './menu.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1400,
    minHeight: 900,
    center: true,
    resizable: true,
    show: false,
    backgroundColor: '#0A0A0B',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Any attempt to open a new window (e.g. target="_blank") is
  // redirected to the OS default browser instead of opening inside
  // the app - KDOS has no need for secondary renderer windows.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    void mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createApplicationMenu()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})