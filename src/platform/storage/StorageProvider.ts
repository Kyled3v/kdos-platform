/**
 * Generic, strongly typed local storage contract for KDOS.
 *
 * Any repository responsible for a single persisted document (Brand,
 * Settings, and future module-level configuration) depends on this
 * interface rather than a concrete storage backend, so the underlying
 * persistence mechanism can change without affecting repository code.
 */
export interface StorageProvider<TData> {
  initialize(): Promise<void>;
  load(key: string): Promise<TData | null>;
  save(key: string, data: TData): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
