import type { UpdatePipelineResult } from "./UpdatePipelineResult";

export interface IUpdatePipeline {
  run(): Promise<UpdatePipelineResult>;
}