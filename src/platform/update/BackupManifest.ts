/**
 * BackupManifest
 *
 * Records every file included in a backup, together with its SHA-256
 * checksum, byte size, and original installation location. The
 * manifest is written alongside the backup so RollbackManager can
 * restore each file to the correct path and verify integrity after
 * restoration.
 */

export interface BackupFileRecord {
  readonly relativePath: string;
  readonly originalAbsolutePath: string;
  readonly backupAbsolutePath: string;
  readonly checksum: string;
  readonly sizeInBytes: number;
}

export interface BackupManifest {
  readonly restorePointId: string;
  readonly version: string;
  readonly createdAt: Date;
  readonly backedUpFiles: ReadonlyArray<BackupFileRecord>;
  readonly checksums: ReadonlyArray<string>;
  readonly sizes: ReadonlyArray<number>;
  readonly originalLocations: ReadonlyArray<string>;
}

interface SerializedBackupManifest {
  readonly restorePointId: string;
  readonly version: string;
  readonly createdAt: string;
  readonly backedUpFiles: ReadonlyArray<BackupFileRecord>;
  readonly checksums: ReadonlyArray<string>;
  readonly sizes: ReadonlyArray<number>;
  readonly originalLocations: ReadonlyArray<string>;
}

export function buildBackupManifest(
  restorePointId: string,
  version: string,
  backedUpFiles: ReadonlyArray<BackupFileRecord>
): BackupManifest {
  return {
    restorePointId,
    version,
    createdAt: new Date(),
    backedUpFiles,
    checksums: backedUpFiles.map((f) => f.checksum),
    sizes: backedUpFiles.map((f) => f.sizeInBytes),
    originalLocations: backedUpFiles.map((f) => f.originalAbsolutePath),
  };
}

export function serializeBackupManifest(manifest: BackupManifest): string {
  const serializable: SerializedBackupManifest = {
    restorePointId: manifest.restorePointId,
    version: manifest.version,
    createdAt: manifest.createdAt.toISOString(),
    backedUpFiles: manifest.backedUpFiles,
    checksums: manifest.checksums,
    sizes: manifest.sizes,
    originalLocations: manifest.originalLocations,
  };

  return JSON.stringify(serializable, null, 2);
}

export function deserializeBackupManifest(json: string): BackupManifest {
  const parsed = JSON.parse(json) as SerializedBackupManifest;

  if (
    typeof parsed.restorePointId !== "string" ||
    typeof parsed.version !== "string" ||
    typeof parsed.createdAt !== "string" ||
    !Array.isArray(parsed.backedUpFiles) ||
    !Array.isArray(parsed.checksums) ||
    !Array.isArray(parsed.sizes) ||
    !Array.isArray(parsed.originalLocations)
  ) {
    throw new Error("Backup manifest JSON is missing required fields or contains invalid types.");
  }

  const createdAt = new Date(parsed.createdAt);

  if (isNaN(createdAt.getTime())) {
    throw new Error(`Backup manifest contains an invalid createdAt: ${parsed.createdAt}`);
  }

  return {
    restorePointId: parsed.restorePointId,
    version: parsed.version,
    createdAt,
    backedUpFiles: parsed.backedUpFiles,
    checksums: parsed.checksums,
    sizes: parsed.sizes,
    originalLocations: parsed.originalLocations,
  };
}