/**
 * GitHubUpdateBootstrap
 *
 * Entry point called once during Electron startup. Constructs the
 * complete update engine from its constituent parts, restores any
 * pending post-update session, and starts the UpdateScheduler.
 *
 * Safe to call only once: a second call is a no-op and returns the
 * existing scheduler instance.
 *
 * No Electron APIs are called here directly. All platform-specific
 * dependencies (gateways, crypto providers, etc.) are supplied by the
 * caller at the composition root.
 */

import { UpdateService, UpdateServiceOptions, UpdateServiceNetworkGateway } from "./UpdateService";
import { UpdateScheduler, UpdateSchedulerOptions } from "./UpdateScheduler";
import { VersionComparator } from "./VersionComparator";

import { GitHubVerifier } from "../github-verifier/GitHubVerifier";
import { ChecksumValidator } from "../github-verifier/ChecksumValidator";
import { SignatureValidator } from "../github-verifier/SignatureValidator";
import { GitHubVerifierStorageGateway } from "../github-verifier/GitHubVerifier";

import { UpdateInstaller } from "../production-installer/UpdateInstaller";
import { PackageExtractor } from "../production-installer/PackageExtractor";
import { FileReplacer } from "../production-installer/FileReplacer";
import { PackageExtractorOptions } from "../production-installer/PackageExtractor";
import { FileReplacerOptions } from "../production-installer/FileReplacer";

import { BackupManager } from "../backup-system/BackupManager";
import { BackupStorageGateway, BackupManagerOptions } from "../backup-system/BackupManager";
import { PackageExtractorGateway } from "../production-installer/PackageExtractor";
import { FileReplacerGateway } from "../production-installer/FileReplacer";

import { RestartManager } from "../restart-system/RestartManager";
import {
  ElectronRestartGateway,
  RestartStorageGateway,
  RestartManagerOptions,
} from "../restart-system/RestartManager";
import { RestartReport } from "../restart-system/RestartReport";
import { ChecksumCryptoGateway } from "../github-verifier/ChecksumValidator";
import { SignatureCryptoGateway } from "../github-verifier/SignatureValidator";

export interface GitHubUpdateBootstrapDependencies {
  readonly network: UpdateServiceNetworkGateway;
  readonly verifierStorage: GitHubVerifierStorageGateway;
  readonly checksumCrypto: ChecksumCryptoGateway;
  readonly signatureCrypto: SignatureCryptoGateway;
  readonly extractorGateway: PackageExtractorGateway;
  readonly replacerGateway: FileReplacerGateway;
  readonly backupStorage: BackupStorageGateway;
  readonly electronRestart: ElectronRestartGateway;
  readonly restartStorage: RestartStorageGateway;
}

export interface GitHubUpdateBootstrapOptions {
  readonly updateService: UpdateServiceOptions;
  readonly extractor: PackageExtractorOptions;
  readonly replacer: FileReplacerOptions;
  readonly backup: BackupManagerOptions;
  readonly restart: RestartManagerOptions;
  readonly scheduler?: UpdateSchedulerOptions;
}

export interface BootstrapResult {
  readonly scheduler: UpdateScheduler;
  readonly sessionReport: RestartReport | undefined;
}

export class GitHubUpdateBootstrap {
  private static instance: GitHubUpdateBootstrap | undefined;

  private readonly deps: GitHubUpdateBootstrapDependencies;
  private readonly options: GitHubUpdateBootstrapOptions;

  private scheduler: UpdateScheduler | undefined;

  private constructor(
    deps: GitHubUpdateBootstrapDependencies,
    options: GitHubUpdateBootstrapOptions
  ) {
    this.deps = deps;
    this.options = options;
  }

  public static create(
    deps: GitHubUpdateBootstrapDependencies,
    options: GitHubUpdateBootstrapOptions
  ): GitHubUpdateBootstrap {
    if (GitHubUpdateBootstrap.instance === undefined) {
      GitHubUpdateBootstrap.instance = new GitHubUpdateBootstrap(deps, options);
    }

    return GitHubUpdateBootstrap.instance;
  }

  public static reset(): void {
    GitHubUpdateBootstrap.instance = undefined;
  }

  public async initialize(): Promise<BootstrapResult> {
    if (this.scheduler !== undefined) {
      return { scheduler: this.scheduler, sessionReport: undefined };
    }

    const restartManager = new RestartManager(
      this.deps.electronRestart,
      this.deps.restartStorage,
      this.options.restart
    );

    const sessionReport = await restartManager.restoreSession();

    const checksumValidator = new ChecksumValidator(this.deps.checksumCrypto);
    const signatureValidator = new SignatureValidator(this.deps.signatureCrypto);

    const verifier = new GitHubVerifier(
      this.deps.verifierStorage,
      checksumValidator,
      signatureValidator
    );

    const backupManager = new BackupManager(this.deps.backupStorage, this.options.backup);

    const extractor = new PackageExtractor(
      this.deps.extractorGateway,
      this.options.extractor
    );

    const replacer = new FileReplacer(this.deps.replacerGateway, this.options.replacer);

    const installer = new UpdateInstaller(extractor, replacer, backupManager);

    const versionComparator = new VersionComparator();

    const updateService = new UpdateService(
      this.deps.network,
      verifier,
      installer,
      restartManager,
      versionComparator,
      this.options.updateService
    );

    const scheduler = new UpdateScheduler(updateService, this.options.scheduler);

    scheduler.start();

    this.scheduler = scheduler;

    return { scheduler, sessionReport };
  }
}