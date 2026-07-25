import { UpdateEventType, type UpdateEventBus } from "@/platform/update/UpdateEvents";
import type { UpdateLogger } from "@/platform/update/UpdateLogger";

/**
 * Every stage of the update pipeline, in execution order, mapping onto
 * the existing UpdateDetector, VersionComparator, PackageVerifier,
 * BackupManager, PackageExtractor, FileReplacer, PackageInstaller,
 * RestartCoordinator, and RestartManager components.
 */
export enum UpdateStageName {
  DETECT = "DETECT",
  COMPARE_VERSION = "COMPARE_VERSION",
  VERIFY_PACKAGE = "VERIFY_PACKAGE",
  BACKUP = "BACKUP",
  EXTRACT_PACKAGE = "EXTRACT_PACKAGE",
  REPLACE_FILES = "REPLACE_FILES",
  INSTALL_PACKAGE = "INSTALL_PACKAGE",
  COORDINATE_RESTART = "COORDINATE_RESTART",
  RESTART = "RESTART",
}

const STAGE_ORDER: readonly UpdateStageName[] = [
  UpdateStageName.DETECT,
  UpdateStageName.COMPARE_VERSION,
  UpdateStageName.VERIFY_PACKAGE,
  UpdateStageName.BACKUP,
  UpdateStageName.EXTRACT_PACKAGE,
  UpdateStageName.REPLACE_FILES,
  UpdateStageName.INSTALL_PACKAGE,
  UpdateStageName.COORDINATE_RESTART,
  UpdateStageName.RESTART,
];

const STAGE_EVENTS: Readonly<Record<UpdateStageName, UpdateEventType>> = {
  [UpdateStageName.DETECT]: UpdateEventType.CHECKING,
  [UpdateStageName.COMPARE_VERSION]: UpdateEventType.FOUND,
  [UpdateStageName.VERIFY_PACKAGE]: UpdateEventType.VERIFYING,
  [UpdateStageName.BACKUP]: UpdateEventType.INSTALLING,
  [UpdateStageName.EXTRACT_PACKAGE]: UpdateEventType.INSTALLING,
  [UpdateStageName.REPLACE_FILES]: UpdateEventType.INSTALLING,
  [UpdateStageName.INSTALL_PACKAGE]: UpdateEventType.INSTALLING,
  [UpdateStageName.COORDINATE_RESTART]: UpdateEventType.RESTARTING,
  [UpdateStageName.RESTART]: UpdateEventType.RESTARTING,
};

/**
 * Data threaded through the pipeline from stage to stage. Deliberately
 * generic — each stage owns the meaning of the keys it reads and
 * writes, so this orchestrator never needs to know the internal shape
 * of any individual update component.
 */
export type UpdateContext = Readonly<Record<string, unknown>>;

/**
 * Contract every pipeline stage (UpdateDetector, VersionComparator,
 * PackageVerifier, BackupManager, PackageExtractor, FileReplacer,
 * PackageInstaller, RestartCoordinator, RestartManager) must satisfy to
 * participate in the orchestrated pipeline.
 */
export interface UpdateStageHandler {
  readonly stageName: UpdateStageName;
  execute(context: UpdateContext): Promise<UpdateContext>;
}

export enum UpdateOrchestratorState {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Coordinates the complete update lifecycle across every pipeline
 * stage, publishing {@link UpdateEventBus} events and
 * {@link UpdateLogger} entries as it progresses. Holds no
 * implementation of any individual stage — each is supplied via
 * dependency injection, satisfying the {@link UpdateStageHandler}
 * contract.
 */
export class UpdateOrchestrator {
  private readonly stages: ReadonlyMap<UpdateStageName, UpdateStageHandler>;
  private readonly eventBus: UpdateEventBus;
  private readonly logger: UpdateLogger;

  private state: UpdateOrchestratorState;
  private context: UpdateContext;
  private nextStageIndex: number;

  constructor(
    stages: ReadonlyMap<UpdateStageName, UpdateStageHandler>,
    eventBus: UpdateEventBus,
    logger: UpdateLogger,
  ) {
    this.stages = stages;
    this.eventBus = eventBus;
    this.logger = logger;
    this.state = UpdateOrchestratorState.IDLE;
    this.context = {};
    this.nextStageIndex = 0;
  }

  /**
   * Validates every required stage handler is present and resets the
   * orchestrator to a clean starting state.
   */
  initialize(): void {
    for (const stageName of STAGE_ORDER) {
      if (!this.stages.has(stageName)) {
        throw new Error(`UpdateOrchestrator is missing a handler for stage "${stageName}".`);
      }
    }

    this.state = UpdateOrchestratorState.IDLE;
    this.context = {};
    this.nextStageIndex = 0;
    this.logger.log("Update orchestrator initialized.");
  }

  /**
   * Runs the pipeline from its current position through to completion,
   * unless cancelled partway through.
   */
  async run(): Promise<void> {
    if (this.state === UpdateOrchestratorState.RUNNING) {
      throw new Error("UpdateOrchestrator is already running.");
    }

    this.state = UpdateOrchestratorState.RUNNING;
    await this.executeFromCurrentStage();
  }

  /**
   * Requests that the pipeline stop before its next stage. The current
   * stage index is preserved so resume() can continue from that point.
   */
  cancel(): void {
    if (this.state !== UpdateOrchestratorState.RUNNING) {
      throw new Error("UpdateOrchestrator can only be cancelled while running.");
    }

    this.state = UpdateOrchestratorState.CANCELLED;
    this.logger.warning(`Update cancelled before stage "${STAGE_ORDER[this.nextStageIndex]}".`);
  }

  /**
   * Resumes a cancelled pipeline from the stage it was cancelled at.
   */
  async resume(): Promise<void> {
    if (this.state !== UpdateOrchestratorState.CANCELLED) {
      throw new Error("UpdateOrchestrator can only resume from a cancelled state.");
    }

    this.state = UpdateOrchestratorState.RUNNING;
    this.logger.log(`Update resumed from stage "${STAGE_ORDER[this.nextStageIndex]}".`);
    await this.executeFromCurrentStage();
  }

  /**
   * Finalizes the orchestrator after it has completed or failed,
   * resetting it so it can be initialized for a subsequent update.
   */
  finish(): void {
    if (this.state !== UpdateOrchestratorState.COMPLETED && this.state !== UpdateOrchestratorState.FAILED) {
      throw new Error("UpdateOrchestrator can only finish after completing or failing.");
    }

    this.logger.log(`Update orchestrator finished in state "${this.state}".`);
    this.state = UpdateOrchestratorState.IDLE;
    this.context = {};
    this.nextStageIndex = 0;
  }

  getState(): UpdateOrchestratorState {
    return this.state;
  }

  private async executeFromCurrentStage(): Promise<void> {
    try {
      while (this.nextStageIndex < STAGE_ORDER.length) {
        if (this.state === UpdateOrchestratorState.CANCELLED) {
          return;
        }

        const stageName = STAGE_ORDER[this.nextStageIndex];
        const handler = this.stages.get(stageName);

        if (!handler) {
          throw new Error(`UpdateOrchestrator is missing a handler for stage "${stageName}".`);
        }

        this.eventBus.emit(STAGE_EVENTS[stageName], `Running stage "${stageName}".`);
        this.logger.log(`Running stage "${stageName}".`);

        this.context = await handler.execute(this.context);
        this.nextStageIndex += 1;
      }

      this.state = UpdateOrchestratorState.COMPLETED;
      this.logger.log("Update completed successfully.");
      this.eventBus.emit(UpdateEventType.COMPLETED, "Update completed successfully.");
    } catch (error) {
      this.state = UpdateOrchestratorState.FAILED;
      const message = error instanceof Error ? error.message : "Unknown update error.";
      this.logger.error(`Update failed: ${message}`);
      this.eventBus.emit(UpdateEventType.FAILED, message);
      throw error;
    }
  }
}