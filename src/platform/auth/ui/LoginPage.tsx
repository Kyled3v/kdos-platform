import { AuthLayout } from "../../../components/auth/AuthLayout";
import { AuthCard } from "../../../components/auth/AuthCard";
import { LoginForm } from "./LoginForm";
import type { AuthService } from "../services/AuthService";
import type { AuthSession } from "../models/AuthSession";

interface LoginPageProps {
  readonly authService: AuthService;
  readonly onSuccess: (session: AuthSession) => void;
  readonly onForgotPassword: () => void;
  readonly onRegister: () => void;
}

export function LoginPage({
  authService,
  onSuccess,
  onForgotPassword,
  onRegister,
}: LoginPageProps): JSX.Element {
  return (
    <AuthLayout>
      <AuthCard>
        <LoginForm
          authService={authService}
          onSuccess={onSuccess}
          onForgotPassword={onForgotPassword}
          onRegister={onRegister}
        />
      </AuthCard>
    </AuthLayout>
  );
}