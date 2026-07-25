/**
 * StorageEngine.ts
 *
 * Location: src/storage/engine/StorageEngine.ts
 *
 * The main storage controller every repository in KDOS reads and
 * writes JSON through. StorageEngine knows nothing about what any
 * given file means (that is the repositories' job) - it only knows
 * how to reliably initialize the storage directory, and read, write,
 * and check for JSON files inside it, recovering gracefully if a file
 * is ever found corrupted on disk.
 *
 * NOTE ON RUNTIME CONTEXT:
 * This file uses Node's `fs`/`path` modules and depends on
 * StorageProvider (which imports Electron's `app`), so it is intended
 * for use from Electron's main process, not the sandboxed renderer.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { StorageProvider } from './StorageProvider'

/**
 * StorageEngine
 *
 * Single responsibility: reliable, generic JSON persistence to a
 * single root directory, with atomic writes and corruption recovery.
 *
 * This class:
 *   - Writes via a temp-file-then-rename sequence, so a write that is
 *     interrupted partway through (crash, power loss) can never leave
 *     a half-written file in the file a reader will actually open.
 *   - On read, if a file's contents fail to parse as JSON, quarantines
 *     the corrupted file (renames it aside with a timestamp) rather
 *     than throwing or silently deleting it, and reports "no data"
 *     to the caller so it can fall back to defaults.
 *   - Is dependency-injection ready: the StorageProvider it resolves
 *     paths through is supplied at construction, defaulting to a
 *     fresh instance when omitted.
 */
export class StorageEngine {
  private readonly storageProvider: StorageProvider
  private initialized = false

  public constructor(storageProvider: StorageProvider = new StorageProvider()) {
    this.storageProvider = storageProvider
  }

  /**
   * Ensures the root storage directory exists, creating it (and any
   * missing parent directories) if necessary. Safe to call more than
   * once - subsequent calls are no-ops. Every other method on this
   * class calls this internally, so callers are never required to
   * call it themselves, though doing so once at application startup
   * is reasonable for surfacing storage errors early.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    const storagePath = this.storageProvider.getStoragePath()
    await fs.mkdir(storagePath, { recursive: true })
    this.initialized = true
  }

  /**
   * Checks whether a given file exists in the storage directory.
   *
   * @param fileName - The file name (not a full path) to check for.
   */
  public async exists(fileName: string): Promise<boolean> {
    await this.initialize()

    try {
      await fs.access(this.resolvePath(fileName))
      return true
    } catch {
      return false
    }
  }

  /**
   * Reads and parses a JSON file from the storage directory.
   *
   * @param fileName - The file name (not a full path) to read.
   * @returns The parsed contents, or null if the file does not exist
   *          or its contents could not be parsed as JSON (in which
   *          case the corrupted file is quarantined rather than
   *          left in place).
   * @throws Error if the file exists but could not be read for a
   *         reason other than not existing (e.g. a permissions
   *         error).
   */
  public async read<T>(fileName: string): Promise<T | null> {
    await this.initialize()
    const filePath = this.resolvePath(fileName)

    let raw: string
    try {
      raw = await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      if (this.isFileNotFoundError(error)) {
        return null
      }
      throw new Error(`StorageEngine: failed to read "${fileName}": ${this.describeError(error)}`)
    }

    try {
      return JSON.parse(raw) as T
    } catch {
      await this.quarantineCorruptedFile(filePath)
      return null
    }
  }

  /**
   * Serializes and writes a value to a JSON file in the storage
   * directory, via an atomic temp-file-then-rename sequence.
   *
   * @param fileName - The file name (not a full path) to write.
   * @param data - The value to serialize as JSON.
   * @throws Error if the write or the final rename fails.
   */
  public async write<T>(fileName: string, data: T): Promise<void> {
    await this.initialize()
    const filePath = this.resolvePath(fileName)
    const temporaryPath = `${filePath}.tmp`
    const serialized = JSON.stringify(data, null, 2)

    try {
      await fs.writeFile(temporaryPath, serialized, 'utf-8')
      await fs.rename(temporaryPath, filePath)
    } catch (error) {
      throw new Error(`StorageEngine: failed to write "${fileName}": ${this.describeError(error)}`)
    }
  }

  private resolvePath(fileName: string): string {
    return path.join(this.storageProvider.getStoragePath(), fileName)
  }

  private async quarantineCorruptedFile(filePath: string): Promise<void> {
    const quarantinePath = `${filePath}.corrupted-${Date.now()}`
    try {
      await fs.rename(filePath, quarantinePath)
    } catch {
      // Quarantining is a best-effort recovery step. If even the
      // rename fails, the caller has already received null and will
      // fall back to default data - there is nothing further this
      // method can safely do without risking data loss.
    }
  }

  private isFileNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === 'ENOENT'
    )
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }
}

