import type { IModule } from "./IModule";

export abstract class Module implements IModule {
  public abstract readonly id: string;
  public abstract readonly name: string;

  public abstract initialize(): Promise<void>;
  public abstract shutdown(): Promise<void>;
}