/**
 * UpdateHistory
 *
 * Represents every installed update.
 */

export interface HistoryEntry {
  readonly version: string;
  readonly buildNumber: string;
  readonly installedDate: Date;
  readonly successful: boolean;
  readonly rollbackAvailable: boolean;
  readonly releaseNotes: string;
}

export interface HistorySummary {
  readonly totalInstalls: number;
  readonly successfulInstalls: number;
  readonly failedInstalls: number;
  readonly lastInstalledVersion: string | undefined;
  readonly lastInstalledDate: Date | undefined;
}

export interface HistoryStorageGateway {
  pathExists(filePath: string): Promise<boolean>;
  readTextFile(filePath: string): Promise<string>;
  writeTextFile(filePath: string, contents: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
}

export interface UpdateHistoryOptions {
  readonly historyFilePath: string;
}

interface SerializedHistoryEntry {
  readonly version: string;
  readonly buildNumber: string;
  readonly installedDate: string;
  readonly successful: boolean;
  readonly rollbackAvailable: boolean;
  readonly releaseNotes: string;
}

export class UpdateHistory {
  private readonly storage: HistoryStorageGateway;
  private readonly options: UpdateHistoryOptions;
  private entries: ReadonlyArray<HistoryEntry>;

  public constructor(storage: HistoryStorageGateway, options: UpdateHistoryOptions) {
    this.storage = storage;
    this.options = options;
    this.entries = [];
  }

  public async loadHistory(): Promise<ReadonlyArray<HistoryEntry>> {
    const exists = await this.storage.pathExists(this.options.historyFilePath);

    if (!exists) {
      this.entries = [];
      return this.entries;
    }

    const contents = await this.storage.readTextFile(this.options.historyFilePath);
    const parsedEntries = JSON.parse(contents) as ReadonlyArray<SerializedHistoryEntry>;

    this.entries = parsedEntries.map((entry) => ({
      version: entry.version,
      buildNumber: entry.buildNumber,
      installedDate: new Date(entry.installedDate),
      successful: entry.successful,
      rollbackAvailable: entry.rollbackAvailable,
      releaseNotes: entry.releaseNotes,
    }));

    return this.entries;
  }

  public async saveHistory(entries: ReadonlyArray<HistoryEntry>): Promise<void> {
    this.entries = entries;
    await this.persist();
  }

  public async append(entry: HistoryEntry): Promise<void> {
    this.entries = [...this.entries, entry];
    await this.persist();
  }

  public async clear(): Promise<void> {
    this.entries = [];

    const exists = await this.storage.pathExists(this.options.historyFilePath);

    if (exists) {
      await this.storage.deleteFile(this.options.historyFilePath);
    }
  }

  public summarize(): HistorySummary {
    const successfulInstalls = this.entries.filter((entry) => entry.successful).length;
    const failedInstalls = this.entries.length - successfulInstalls;
    const lastEntry = this.entries[this.entries.length - 1];

    return {
      totalInstalls: this.entries.length,
      successfulInstalls,
      failedInstalls,
      lastInstalledVersion: lastEntry?.version,
      lastInstalledDate: lastEntry?.installedDate,
    };
  }

  private async persist(): Promise<void> {
    const serialized: ReadonlyArray<SerializedHistoryEntry> = this.entries.map((entry) => ({
      version: entry.version,
      buildNumber: entry.buildNumber,
      installedDate: entry.installedDate.toISOString(),
      successful: entry.successful,
      rollbackAvailable: entry.rollbackAvailable,
      releaseNotes: entry.releaseNotes,
    }));

    await this.storage.writeTextFile(
      this.options.historyFilePath,
      JSON.stringify(serialized, null, 2)
    );
  }
}