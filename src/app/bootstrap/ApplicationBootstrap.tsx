import { useMemo } from "react";

import { useBootstrap } from "@/app/bootstrap/hooks/useBootstrap";
import { BootstrapStatus } from "@/app/bootstrap/types/BootstrapStatus";

import { LoginPage } from "@/platform/auth/ui/LoginPage";
import { JsonAuthStorage } from "@/platform/auth/storage/AuthStorage";
import { AuthService } from "@/platform/auth/services/AuthService";

export function ApplicationBootstrap(): JSX.Element {
  const state = useBootstrap();

  const authService = useMemo(() => {
    const storage = new JsonAuthStorage("./storage");
    return new AuthService(storage);
  }, []);

  switch (state.status) {
    case BootstrapStatus.UNAUTHENTICATED:
      return (
        <LoginPage
          authService={authService}
          onSuccess={(session) => {
            console.log("Logged in:", session);
          }}
          onForgotPassword={() => {
            console.log("Forgot password");
          }}
          onRegister={() => {
            console.log("Register");
          }}
        />
      );

    case BootstrapStatus.AUTHENTICATED:
      return <div>KDOS Desktop (coming next)</div>;

    case BootstrapStatus.FAILED:
      return (
        <div>
          <h2>Bootstrap Failed</h2>
          <p>{state.error}</p>
        </div>
      );

    default:
      return <div>Loading...</div>;
  }
}