import type { IModule } from "./IModule";

export class ModuleManager {
  private readonly modules = new Map<string, IModule>();

  public register(module: IModule): void {
    this.modules.set(module.id, module);
  }

  public async initializeAll(): Promise<void> {
    for (const module of this.modules.values()) {
      await module.initialize();
    }
  }

  public async shutdownAll(): Promise<void> {
    for (const module of this.modules.values()) {
      await module.shutdown();
    }
  }

  public getModules(): readonly IModule[] {
    return [...this.modules.values()];
  }
}