import type { StorageProvider } from "@/platform/storage/StorageProvider";
import type { Brand } from "@/platform/models/Brand";

const BRAND_STORAGE_KEY = "brand";

/**
 * Repository responsible only for {@link Brand} persistence. Contains
 * no storage implementation of its own — every operation delegates to
 * an injected {@link StorageProvider}, so this repository depends on
 * an interface rather than any concrete storage backend.
 */
export class BrandRepository {
  private readonly storageProvider: StorageProvider<Brand>;

  constructor(storageProvider: StorageProvider<Brand>) {
    this.storageProvider = storageProvider;
  }

  async load(): Promise<Brand | null> {
    return this.storageProvider.load(BRAND_STORAGE_KEY);
  }

  async save(brand: Brand): Promise<void> {
    await this.storageProvider.save(BRAND_STORAGE_KEY, brand);
  }

  async exists(): Promise<boolean> {
    return this.storageProvider.exists(BRAND_STORAGE_KEY);
  }

  async delete(): Promise<void> {
    await this.storageProvider.delete(BRAND_STORAGE_KEY);
  }
}
