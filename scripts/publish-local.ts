import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { UpdatePackage } from "@/platform/updater/PackageBuilder";

const RELEASES_ROOT = join("storage", "updates", "releases");
const BUILD_OUTPUT_DIRECTORY = "out";

/**
 * Locations an update package was published to on the local machine.
 */
export interface PublishResult {
  readonly releaseDirectory: string;
  readonly packageDirectory: string;
  readonly manifestPath: string;
}

/**
 * Publishes a freshly built {@link UpdatePackage} into the local
 * releases store, copying the built application output and writing the
 * manifest alongside it.
 */
export class LocalPublisher {
  publish(updatePackage: UpdatePackage): PublishResult {
    const releaseDirectory = join(RELEASES_ROOT, updatePackage.manifest.version);
    const packageDirectory = join(releaseDirectory, "package");
    const manifestPath = join(releaseDirectory, "manifest.json");

    mkdirSync(packageDirectory, { recursive: true });
    cpSync(BUILD_OUTPUT_DIRECTORY, packageDirectory, { recursive: true });
    writeFileSync(manifestPath, `${JSON.stringify(updatePackage.manifest, null, 2)}\n`, "utf-8");

    return { releaseDirectory, packageDirectory, manifestPath };
  }
}