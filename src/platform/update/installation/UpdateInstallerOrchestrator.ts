import type { IUpdateInstallerOrchestrator, VerifiedInstaller } from "./IUpdateInstallerOrchestrator";
import {
  InstallationExecutionResult,
  InstallationExecutionStatus
} from "./InstallationExecutionResult";

export interface InstallerGateway {
  execute(
    installerPath: string
  ): Promise<void>;
}

export class UpdateInstallerOrchestrator
  implements IUpdateInstallerOrchestrator {

  constructor(
    private readonly gateway: InstallerGateway
  ) {}

  public async execute(
    installer: VerifiedInstaller
  ): Promise<InstallationExecutionResult> {

    const startedAt = new Date();

    try {

      await this.gateway.execute(
        installer.installerPath
      );

      return {
        status: InstallationExecutionStatus.Success,
        startedAt,
        completedAt: new Date(),
        installedFiles: []
      };

    } catch (error) {

      return {
        status: InstallationExecutionStatus.Failed,
        startedAt,
        completedAt: new Date(),
        installedFiles: [],
        failure: {
          code: "INSTALLATION_FAILED",
          message: error instanceof Error
            ? error.message
            : "Unknown installation error"
        }
      };

    }

  }

}