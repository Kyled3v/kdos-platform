/**
 * Manifest
 *
 * Describes the identity and contents of a KDOS update package.
 */

export interface ManifestFileEntry {
  readonly relativePath: string;
  readonly sizeInBytes: number;
  readonly checksum: string;
}

export interface Manifest {
  readonly applicationName: string;
  readonly applicationVersion: string;
  readonly buildNumber: string;
  readonly releaseDate: Date;
  readonly packageName: string;
  readonly checksum: string;
  readonly fileList: ReadonlyArray<ManifestFileEntry>;
  readonly packageSize: number;
}

export interface ManifestInput {
  readonly applicationName: string;
  readonly applicationVersion: string;
  readonly buildNumber: string;
  readonly releaseDate: Date;
  readonly packageName: string;
  readonly checksum: string;
  readonly fileList: ReadonlyArray<ManifestFileEntry>;
  readonly packageSize: number;
}

export function createManifest(input: ManifestInput): Manifest {
  return {
    applicationName: input.applicationName,
    applicationVersion: input.applicationVersion,
    buildNumber: input.buildNumber,
    releaseDate: input.releaseDate,
    packageName: input.packageName,
    checksum: input.checksum,
    fileList: input.fileList,
    packageSize: input.packageSize,
  };
}

export function serializeManifest(manifest: Manifest): string {
  const serializable = {
    applicationName: manifest.applicationName,
    applicationVersion: manifest.applicationVersion,
    buildNumber: manifest.buildNumber,
    releaseDate: manifest.releaseDate.toISOString(),
    packageName: manifest.packageName,
    checksum: manifest.checksum,
    fileList: manifest.fileList,
    packageSize: manifest.packageSize,
  };

  return JSON.stringify(serializable, null, 2);
}

export function deserializeManifest(serializedManifest: string): Manifest {
  const parsed = JSON.parse(serializedManifest) as {
    readonly applicationName: string;
    readonly applicationVersion: string;
    readonly buildNumber: string;
    readonly releaseDate: string;
    readonly packageName: string;
    readonly checksum: string;
    readonly fileList: ReadonlyArray<ManifestFileEntry>;
    readonly packageSize: number;
  };

  return createManifest({
    applicationName: parsed.applicationName,
    applicationVersion: parsed.applicationVersion,
    buildNumber: parsed.buildNumber,
    releaseDate: new Date(parsed.releaseDate),
    packageName: parsed.packageName,
    checksum: parsed.checksum,
    fileList: parsed.fileList,
    packageSize: parsed.packageSize,
  });
}