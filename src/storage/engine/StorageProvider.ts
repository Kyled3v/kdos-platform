/**
 * StorageProvider.ts
 *
 * Location: src/storage/engine/StorageProvider.ts
 *
 * Resolves the root filesystem locations KDOS storage lives under.
 * Every other storage file learns "where on disk" exclusively through
 * this class - nothing else in the storage layer calls
 * `electron.app.getPath` directly, so if that resolution strategy
 * ever needs to change, this is the only file that changes.
 *
 * NOTE ON RUNTIME CONTEXT:
 * This file imports `app` from `electron`, which is only available
 * in Electron's main process (or a utility process with Node/Electron
 * access) - not in the sandboxed renderer. It is written for use from
 * the main process; exposing it to the renderer is a separate
 * concern (an IPC bridge) not addressed by this file.
 */

import { app } from 'electron'
import path from 'node:path'

const STORAGE_DIRECTORY_NAME = 'storage'

/**
 * StorageProvider
 *
 * Single responsibility: resolve the application's own install
 * location and the root directory KDOS's local storage lives under.
 */
export class StorageProvider {
  /**
   * Returns the directory the running KDOS application is installed
   * in (or, in development, the project root Electron was launched
   * from).
   */
  public getApplicationPath(): string {
    return app.getAppPath()
  }

  /**
   * Returns the root directory all KDOS local storage is written
   * under: a "storage" folder inside Electron's per-user, per-OS
   * application data directory (userData). This directory is
   * guaranteed writable and private to this application by the
   * operating system.
   */
  public getStoragePath(): string {
    return path.join(app.getPath('userData'), STORAGE_DIRECTORY_NAME)
  }
}

