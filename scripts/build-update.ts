import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { PackageBuilder, ReleaseFile, UpdatePackage } from "@/platform/updater/PackageBuilder";
import type { Manifest } from "@/platform/updater/Manifest";

const BUILD_OUTPUT_DIRECTORY = "out";

/**
 * Inputs supplied by the release orchestrator that this stage cannot
 * determine on its own.
 */
export interface BuildUpdateOptions {
  readonly version: string;
  readonly buildNumber: string;
  readonly minimumVersion: string;
  readonly releaseNotes: string;
}

/**
 * Builds the KDOS application and assembles the resulting update
 * package, implementing the existing {@link PackageBuilder} contract
 * from the update engine rather than introducing a parallel one.
 */
export class BuildUpdateService implements PackageBuilder {
  private readonly options: BuildUpdateOptions;

  constructor(options: BuildUpdateOptions) {
    this.options = options;
  }

  runBuild(): void {
    execFileSync("npx", ["electron-vite", "build"], { stdio: "inherit" });
  }

  async collectReleaseFiles(): Promise<readonly ReleaseFile[]> {
    const absolutePaths = this.walkDirectory(BUILD_OUTPUT_DIRECTORY);

    return absolutePaths.map((absolutePath) => ({
      relativePath: relative(BUILD_OUTPUT_DIRECTORY, absolutePath).split("\\").join("/"),
      checksum: this.hashFile(absolutePath),
    }));
  }

  async createManifest(files: readonly ReleaseFile[]): Promise<Manifest> {
    const packageSize = files.reduce((total, file) => {
      const absolutePath = join(BUILD_OUTPUT_DIRECTORY, file.relativePath);
      return total + statSync(absolutePath).size;
    }, 0);

    return {
      version: this.options.version,
      buildNumber: this.options.buildNumber,
      releaseDate: new Date().toISOString(),
      minimumVersion: this.options.minimumVersion,
      releaseNotes: this.options.releaseNotes,
      checksum: this.hashFileList(files),
      packageName: `kdos-${this.options.version}.kdos`,
      packageSize,
    };
  }

  async createPackage(manifest: Manifest, files: readonly ReleaseFile[]): Promise<UpdatePackage> {
    return { manifest, files };
  }

  async build(): Promise<UpdatePackage> {
    this.runBuild();

    const files = await this.collectReleaseFiles();
    const manifest = await this.createManifest(files);

    return this.createPackage(manifest, files);
  }

  private walkDirectory(directory: string): readonly string[] {
    const entries = readdirSync(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.walkDirectory(entryPath));
      } else {
        files.push(entryPath);
      }
    }

    return files;
  }

  private hashFile(absolutePath: string): string {
    return createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
  }

  private hashFileList(files: readonly ReleaseFile[]): string {
    const sortedChecksums = [...files]
      .map((file) => file.checksum)
      .sort()
      .join("");

    return createHash("sha256").update(sortedChecksums).digest("hex");
  }
}