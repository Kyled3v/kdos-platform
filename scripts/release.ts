import { userInfo } from "node:os";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { VersionBumper } from "./VersionBumper";
import { BuildUpdateService } from "./build-update";
import { LocalPublisher } from "./publish-local";

/**
 * Full outcome of one release run, recorded as release metadata
 * alongside the published package.
 */
export interface ReleaseSummary {
  readonly version: string;
  readonly buildNumber: string;
  readonly releaseDate: string;
  readonly releasedBy: string;
  readonly releaseDirectory: string;
}

/**
 * Coordinates the complete KDOS release pipeline: version bump, build,
 * package, and publish.
 */
export async function release(): Promise<ReleaseSummary> {
  const versionBumper = new VersionBumper();
  const versionResult = versionBumper.bump("patch");

  const buildService = new BuildUpdateService({
    version: versionResult.nextVersion,
    buildNumber: versionResult.buildNumber,
    minimumVersion: versionResult.previousVersion,
    releaseNotes: process.env.KDOS_RELEASE_NOTES ?? "",
  });

  const updatePackage = await buildService.build();

  const publisher = new LocalPublisher();
  const publishResult = publisher.publish(updatePackage);

  const releasedBy = process.env.KDOS_RELEASE_AUTHOR ?? userInfo().username;

  const summary: ReleaseSummary = {
    version: updatePackage.manifest.version,
    buildNumber: updatePackage.manifest.buildNumber,
    releaseDate: updatePackage.manifest.releaseDate,
    releasedBy,
    releaseDirectory: publishResult.releaseDirectory,
  };

  writeFileSync(
    join(publishResult.releaseDirectory, "release-info.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf-8",
  );

  return summary;
}

release()
  .then((summary) => {
    process.stdout.write(`Release complete: ${summary.version} (build ${summary.buildNumber})\n`);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown release error.";
    process.stderr.write(`Release failed: ${message}\n`);
    process.exitCode = 1;
  });