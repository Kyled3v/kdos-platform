import { VersionComparator } from "./version/VersionComparator";

export interface UpdateDetectionResult {
  readonly updateAvailable: boolean;
  readonly latestVersion: string;
}

export class UpdateDetector {
  constructor(
    private readonly comparator: VersionComparator
  ) {}

  public detect(
    currentVersion: string,
    latestVersion: string
  ): UpdateDetectionResult {

    const comparison = this.comparator.compare(
      currentVersion,
      latestVersion
    );

    return {
      updateAvailable: comparison.updateAvailable,
      latestVersion: comparison.remoteVersion.toString()
    };
  }
}