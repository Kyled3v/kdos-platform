import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmailField, validateEmail } from "./EmailField";
import { PasswordField } from "./PasswordField";
import { RememberMe } from "./RememberMe";
import type { AuthService } from "../services/AuthService";
import type { AuthSession } from "../models/AuthSession";

interface LoginFormProps {
  readonly authService: AuthService;
  readonly onSuccess: (session: AuthSession) => void;
  readonly onForgotPassword: () => void;
  readonly onRegister: () => void;
}

export function LoginForm({
  authService,
  onSuccess,
  onForgotPassword,
  onRegister,
}: LoginFormProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(undefined);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);

  const validate = useCallback((): boolean => {
    const eErr = validateEmail(email);
    const pErr = password.length === 0 ? "Password is required." : undefined;
    setEmailError(eErr);
    setPasswordError(pErr);
    return eErr === undefined && pErr === undefined;
  }, [email, password]);

  const handleSubmit = useCallback(async (e: { preventDefault(): void }): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(undefined);

    try {
      const result = await authService.login({ email: email.trim(), password });

      if (result.ok) {
        if (rememberMe) {
          localStorage.setItem("kdos_session", result.value.sessionId);
        }
        onSuccess(result.value);
      } else {
        setServerError(result.reason);
      }
    } finally {
      setLoading(false);
    }
  }, [authService, email, password, rememberMe, validate, onSuccess]);

  return (
    <motion.form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-white">Sign in to KDOS</h1>
        <p className="text-sm text-zinc-500">Enter your credentials to continue.</p>
      </div>

      <AnimatePresence mode="wait">
        {serverError !== undefined && (
          <motion.div
            key="server-error"
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      <EmailField
        value={email}
        onChange={(v) => { setEmail(v); setEmailError(validateEmail(v)); }}
        error={emailError}
        disabled={loading}
      />

      <div className="flex flex-col gap-1.5">
        <PasswordField
          value={password}
          onChange={(v) => { setPassword(v); setPasswordError(v.length === 0 ? "Password is required." : undefined); }}
          error={passwordError}
          disabled={loading}
        />
        <div className="flex justify-end">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onForgotPassword(); }}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Forgot password?
          </a>
        </div>
      </div>

      <RememberMe
        checked={rememberMe}
        onChange={setRememberMe}
        disabled={loading}
      />

      <motion.button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        aria-label="Sign in"
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className={[
          "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150",
          "bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1c1c1f]",
          "disabled:cursor-not-allowed disabled:opacity-60",
        ].join(" ")}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx={12} cy={12} r={10} />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </motion.button>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onRegister(); }}
          className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          Create one
        </a>
      </p>
    </motion.form>
  );
}