import { useBootstrap } from "@/app/bootstrap/hooks/useBootstrap";
import { BootstrapStatus } from "@/app/bootstrap/types/BootstrapStatus";

export function ApplicationBootstrap(): JSX.Element {
  const state = useBootstrap();

  switch (state.status) {
    case BootstrapStatus.UNAUTHENTICATED:
  return (
    <LoginPage
      authService={authService}
      onSuccess={handleLoginSuccess}
      onForgotPassword={() => {
        console.log("Forgot password");
      }}
      onRegister={() => {
        console.log("Register");
      }}
    />
  );

    case BootstrapStatus.UNAUTHENTICATED:
      return <div>Login Screen (coming next)</div>;

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