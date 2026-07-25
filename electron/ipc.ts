/**
 * Prepares IPC channel registration for the main process.
 *
 * No handlers are registered yet — this function exists as the single,
 * explicit entry point future IPC channels will be wired through, so
 * `main.ts` never needs to change when the first handler is added.
 */
export function registerIPC(): void {
  return;
}

