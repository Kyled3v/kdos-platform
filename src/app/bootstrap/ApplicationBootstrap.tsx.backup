import { useMemo, useState } from "react";

import { useBootstrap } from "@/app/bootstrap/hooks/useBootstrap";
import { BootstrapStatus } from "@/app/bootstrap/types/BootstrapStatus";

import { LoginPage } from "@/platform/auth/ui/LoginPage";
import { RegisterPage } from "@/platform/auth/ui/RegisterPage";
import { RendererAuthService } from "@/platform/auth/services/AuthService";

import type { AuthSession } from "@/platform/auth/models/AuthSession";
import type { CompanyId } from "@/platform/auth/models/AuthUser";

type AuthScreen = "login" | "register";

const DEFAULT_COMPANY_ID = "default-company" as CompanyId;

export function ApplicationBootstrap(): JSX.Element {
  const state = useBootstrap();

  const [screen, setScreen] = useState<AuthScreen>("login");

  const authService = useMemo(() => {
    return new RendererAuthService();
  }, []);

  const handleLoginSuccess = (session: AuthSession): void => {
    console.log("[KDOS] Login successful:", session);

    setScreen("login");
  };

  const handleRegisterSuccess = (session: AuthSession): void => {
    console.log("[KDOS] Registration successful:", session);

    setScreen("login");
  };

  switch (state.status) {
    case BootstrapStatus.UNAUTHENTICATED:
      if (screen === "register") {
        return (
          <RegisterPage
            authService={authService}
            defaultCompanyId={DEFAULT_COMPANY_ID}
            defaultRole="Operator"
            onSuccess={handleRegisterSuccess}
            onLogin={() => {
              console.log("[KDOS] Returning to login");
              setScreen("login");
            }}
          />
        );
      }

      return (
        <LoginPage
          authService={authService}
          onSuccess={handleLoginSuccess}
          onForgotPassword={() => {
            console.log("[KDOS] Forgot password");
          }}
          onRegister={() => {
            console.log("[KDOS] Opening registration");
            setScreen("register");
          }}
        />
      );

    case BootstrapStatus.AUTHENTICATED:
      return (
        <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              KDOS Desktop
            </h1>

            <p className="mt-2 text-zinc-500">
              Authentication successful.
            </p>
          </div>
        </div>
      );

    case BootstrapStatus.FAILED:
      return (
        <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold">
              Bootstrap Failed
            </h2>

            <p className="mt-3 text-red-400">
              {state.error}
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
          <p className="text-zinc-500">
            Loading KDOS...
          </p>
        </div>
      );
  }
}

