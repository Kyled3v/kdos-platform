export interface IModule {
  readonly id: string;
  readonly name: string;

  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}