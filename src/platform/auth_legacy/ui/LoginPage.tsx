import { AuthLayout } from "../../../components/auth/AuthLayout";
import { AuthCard } from "../../../components/auth/AuthCard";
import { LoginForm } from "./LoginForm";
import type { AuthSession } from "../models/AuthSession";

interface LoginPageProps {
  readonly onSuccess: (session: AuthSession) => void;
  readonly onForgotPassword: () => void;
  readonly onRegister: () => void;
}

export function LoginPage({
  onSuccess,
  onForgotPassword,
  onRegister,
}: LoginPageProps): JSX.Element {
  return (
    <AuthLayout>
      <AuthCard>
        <LoginForm
          onSuccess={onSuccess}
          onForgotPassword={onForgotPassword}
          onRegister={onRegister}
        />
      </AuthCard>
    </AuthLayout>
  );
}