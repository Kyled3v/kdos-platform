/**
 * RestorePoint
 *
 * Describes the identity and location of a single backup created
 * before a KDOS update is applied.
 */

export interface RestorePoint {
  readonly id: string;
  readonly version: string;
  readonly timestamp: Date;
  readonly backupPath: string;
}

interface SerializedRestorePoint {
  readonly id: string;
  readonly version: string;
  readonly timestamp: string;
  readonly backupPath: string;
}

export function generateRestorePointId(): string {
  return `rp-${Date.now()}-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0")}`;
}

export function serializeRestorePoint(restorePoint: RestorePoint): string {
  const serializable: SerializedRestorePoint = {
    id: restorePoint.id,
    version: restorePoint.version,
    timestamp: restorePoint.timestamp.toISOString(),
    backupPath: restorePoint.backupPath,
  };

  return JSON.stringify(serializable, null, 2);
}

export function deserializeRestorePoint(json: string): RestorePoint {
  const parsed = JSON.parse(json) as SerializedRestorePoint;

  if (
    typeof parsed.id !== "string" ||
    typeof parsed.version !== "string" ||
    typeof parsed.timestamp !== "string" ||
    typeof parsed.backupPath !== "string"
  ) {
    throw new Error("Restore point JSON is missing required fields or contains invalid types.");
  }

  const timestamp = new Date(parsed.timestamp);

  if (isNaN(timestamp.getTime())) {
    throw new Error(`Restore point contains an invalid timestamp: ${parsed.timestamp}`);
  }

  return {
    id: parsed.id,
    version: parsed.version,
    timestamp,
    backupPath: parsed.backupPath,
  };
}