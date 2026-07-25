import { create } from "zustand";
import type { AppTheme, InstalledModule, UpdateStatus, Workspace } from "@/types/app";

interface AppStoreState {
  readonly version: string;
  readonly installedModules: readonly InstalledModule[];
  readonly currentWorkspace: Workspace | null;
  readonly theme: AppTheme;
  readonly updateStatus: UpdateStatus;
}

interface AppStoreActions {
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setTheme: (theme: AppTheme) => void;
  setUpdateStatus: (status: UpdateStatus) => void;
  setInstalledModules: (modules: readonly InstalledModule[]) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

const DEFAULT_WORKSPACE: Workspace = {
  id: "default",
  name: "KyleDev",
};

export const useAppStore = create<AppStore>((set) => ({
  version: "2.0.0",
  installedModules: [],
  currentWorkspace: DEFAULT_WORKSPACE,
  theme: "dark",
  updateStatus: "up-to-date",

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setTheme: (theme) => set({ theme }),
  setUpdateStatus: (updateStatus) => set({ updateStatus }),
  setInstalledModules: (installedModules) => set({ installedModules }),
}));

