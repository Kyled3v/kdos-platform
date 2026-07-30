import { useState } from "react";
import { motion } from "framer-motion";

import { EmailField, validateEmail } from "../../../components/auth/EmailField";
import { PasswordField } from "../../../components/auth/PasswordField";
import { RememberMe } from "../../../components/auth/RememberMe";

import type { AuthSession } from "../models/AuthSession";

interface LoginFormProps {
  readonly onSuccess: (session: AuthSession) => void;
  readonly onForgotPassword: () => void;
  readonly onRegister: () => void;
}

export function LoginForm({
  onSuccess,
  onForgotPassword,
  onRegister,
}: LoginFormProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();

    const eErr = validateEmail(email);
    const pErr =
      password.trim().length === 0 ? "Password is required." : undefined;

    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) return;

    setLoading(true);

    try {
      // Temporary fake session.
      // This will be replaced with:
      // window.kdos.auth.login(...)
      const session: AuthSession = {
        sessionId: crypto.randomUUID(),
      } as AuthSession;

      if (rememberMe) {
        localStorage.setItem("kdos_session", session.sessionId);
      }

      onSuccess(session);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-xl font-semibold text-white">
        Sign in to KDOS
      </h1>

      <EmailField
        value={email}
        onChange={(value) => {
          setEmail(value);
          setEmailError(validateEmail(value));
        }}
        error={emailError}
        disabled={loading}
      />

      <PasswordField
        value={password}
        onChange={(value) => {
          setPassword(value);
          setPasswordError(
            value.length === 0 ? "Password is required." : undefined
          );
        }}
        error={passwordError}
        disabled={loading}
      />

      <RememberMe
        checked={rememberMe}
        onChange={setRememberMe}
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 py-3 text-white font-semibold disabled:opacity-50"
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm text-indigo-400"
      >
        Forgot Password?
      </button>

      <button
        type="button"
        onClick={onRegister}
        className="text-sm text-indigo-400"
      >
        Create Account
      </button>
    </motion.form>
  );
}