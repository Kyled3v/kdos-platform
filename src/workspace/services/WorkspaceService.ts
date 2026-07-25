import type { WorkspaceState } from "@/workspace/types/workspace";

/**
 * Prepares future workspace state persistence. No storage backend is
 * wired up yet — both methods currently resolve without side effects,
 * establishing the call surface future workspace pages will depend on.
 */
export class WorkspaceService {
  async load(): Promise<WorkspaceState> {
    return Promise.resolve({ workspace: null, isLoading: false });
  }

  async save(state: WorkspaceState): Promise<void> {
    void state;
    return Promise.resolve();
  }
}

