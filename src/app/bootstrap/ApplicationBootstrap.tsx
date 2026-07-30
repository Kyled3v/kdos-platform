
import { useBootstrap } from "@/app/bootstrap/hooks/useBootstrap";
import { BootstrapStatus } from "@/app/bootstrap/types/BootstrapStatus";

import { LoginPage } from "@/platform/auth_legacy/ui/LoginPage";
import type { AuthSession } from "@/platform/auth_legacy/models/AuthSession";

export function ApplicationBootstrap(): JSX.Element {
  const state = useBootstrap();


  switch (state.status) {
    case BootstrapStatus.UNAUTHENTICATED:
      return (
        <LoginPage
          onSuccess={(session: AuthSession) => {
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
