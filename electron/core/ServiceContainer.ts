/**
 * KDOS Service Container
 *
 * Production-grade IoC container.
 *
 * Responsibilities:
 * - Singleton registration
 * - Lazy singleton creation
 * - Factory registration
 * - Instance registration
 * - Service resolution
 * - Runtime cleanup
 */

export type Factory<T> = () => T;

export class ServiceContainer {
  private readonly singletons = new Map<string, unknown>();
  private readonly factories = new Map<string, Factory<unknown>>();
  private readonly instances = new Map<string, unknown>();

  registerSingleton<T>(key: string, factory: Factory<T>): void {
    if (this.factories.has(key) || this.instances.has(key)) {
      throw new Error(`Service '${key}' is already registered.`);
    }

    this.factories.set(key, factory);
  }

  registerInstance<T>(key: string, instance: T): void {
    if (this.factories.has(key) || this.instances.has(key)) {
      throw new Error(`Service '${key}' is already registered.`);
    }

    this.instances.set(key, instance);
  }

  registerFactory<T>(key: string, factory: Factory<T>): void {
    this.registerSingleton(key, factory);
  }

  resolve<T>(key: string): T {
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }

    const factory = this.factories.get(key);

    if (!factory) {
      throw new Error(`Service '${key}' is not registered.`);
    }

    const instance = factory();

    this.singletons.set(key, instance);

    return instance as T;
  }

  has(key: string): boolean {
    return (
      this.instances.has(key) ||
      this.singletons.has(key) ||
      this.factories.has(key)
    );
  }

  remove(key: string): void {
    this.instances.delete(key);
    this.singletons.delete(key);
    this.factories.delete(key);
  }

  clear(): void {
    this.instances.clear();
    this.singletons.clear();
    this.factories.clear();
  }
}

export const container = new ServiceContainer();