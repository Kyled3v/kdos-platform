/**
 * Typed, safe wrapper around the browser `localStorage` API. No
 * external libraries; guards against non-browser environments and
 * malformed stored values.
 */

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const LocalStorage = {
  /**
   * Reads and parses a stored value for the given key. Returns
   * `fallback` if the key is absent, the environment has no storage, or
   * the stored value cannot be parsed.
   */
  get<T>(key: string, fallback: T): T {
    if (!isStorageAvailable()) {
      return fallback;
    }

    const rawValue = window.localStorage.getItem(key);

    if (rawValue === null) {
      return fallback;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return fallback;
    }
  },

  /**
   * Serializes and stores a value under the given key. No-op in
   * environments without storage.
   */
  set<T>(key: string, value: T): void {
    if (!isStorageAvailable()) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Removes the value stored under the given key. No-op in
   * environments without storage.
   */
  remove(key: string): void {
    if (!isStorageAvailable()) {
      return;
    }

    window.localStorage.removeItem(key);
  },

  /**
   * Clears every value in local storage. No-op in environments without
   * storage.
   */
  clear(): void {
    if (!isStorageAvailable()) {
      return;
    }

    window.localStorage.clear();
  },
};

export default LocalStorage;

