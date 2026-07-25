"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { bootstrap, type BootstrapResult, getBootstrapResult } from "@/app/bootstrap/bootstrap";

interface AppProviderState {
  readonly isReady: boolean;
  readonly result: BootstrapResult | null;
}

const AppContext = createContext<AppProviderState | null>(null);

export interface AppProviderProps {
  readonly children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppProviderState>({
    isReady: false,
    result: getBootstrapResult(),
  });

  useEffect(() => {
    let isMounted = true;

    void bootstrap().then(() => {
      if (isMounted) {
        setState({ isReady: true, result: getBootstrapResult() });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}

/**
 * Reads the current bootstrap state. Throws if used outside an
 * `AppProvider`, so consumers cannot silently read stale/undefined
 * state.
 */
export function useAppContext(): AppProviderState {
  const context = useContext(AppContext);

  if (context === null) {
    throw new Error("useAppContext must be used within an AppProvider.");
  }

  return context;
}

export default AppProvider;

