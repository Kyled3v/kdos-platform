import type { InstallationExecutionResult } from "./InstallationExecutionResult";

export interface VerifiedInstaller {
  readonly installerPath: string;
  readonly version: string;
  readonly checksum: string;
}

export interface IUpdateInstallerOrchestrator {
  execute(
    installer: VerifiedInstaller
  ): Promise<InstallationExecutionResult>;
}