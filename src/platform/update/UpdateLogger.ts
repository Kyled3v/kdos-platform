export type UpdateLogSeverity = "Info" | "Warning" | "Error";

/**
 * A single immutable record of an update action.
 */
export interface UpdateLogEntry {
  readonly severity: UpdateLogSeverity;
  readonly message: string;
  readonly recordedAt: string;
}

/**
 * Records every action taken during the update lifecycle. Retains
 * entries in memory only — no console output, no file output.
 */
export class UpdateLogger {
  private readonly entries: UpdateLogEntry[];

  constructor() {
    this.entries = [];
  }

  log(message: string): UpdateLogEntry {
    return this.record("Info", message);
  }

  warning(message: string): UpdateLogEntry {
    return this.record("Warning", message);
  }

  error(message: string): UpdateLogEntry {
    return this.record("Error", message);
  }

  history(): readonly UpdateLogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries.length = 0;
  }

  private record(severity: UpdateLogSeverity, message: string): UpdateLogEntry {
    const entry: UpdateLogEntry = {
      severity,
      message,
      recordedAt: new Date().toISOString(),
    };

    this.entries.push(entry);

    return entry;
  }
}