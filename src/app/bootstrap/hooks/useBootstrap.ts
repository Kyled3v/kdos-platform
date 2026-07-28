import { useEffect, useState } from "react";
import {
  BootstrapState,
  INITIAL_BOOTSTRAP_STATE,
} from "../state/BootstrapState";
import { BootstrapService } from "../services/BootstrapService";

export function useBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>(
    INITIAL_BOOTSTRAP_STATE,
  );

  useEffect(() => {
    let mounted = true;

    const bootstrap = async (): Promise<void> => {
      const service = new BootstrapService();
      const result = await service.initialise();

      if (mounted) {
        setState(result);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}