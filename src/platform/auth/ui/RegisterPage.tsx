import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthLayout } from "./AuthLayout";
import { AuthCard } from "./AuthCard";
import { EmailField, validateEmail } from "./EmailField";
import { PasswordField } from "./PasswordField";
import { validatePassword } from "../security/PasswordPolicy";
import type { AuthService, RegisterRequest } from "../services/AuthService";
import type { AuthSession } from "../models/AuthSession";
import type { UserRole, CompanyId } from "../models/AuthUser";

interface RegisterPageProps {
  readonly authService: AuthService;
  readonly onSuccess: (session: AuthSession) => void;
  readonly onLogin: () => void;
  readonly defaultCompanyId: CompanyId;
  readonly defaultRole?: UserRole;
}

export function RegisterPage({
  authService,
  onSuccess,
  onLogin,
  defaultCompanyId,
  defaultRole = "Operator",
}: RegisterPageProps): JSX.Element {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (firstName.trim().length === 0) errors["firstName"] = "First name is required.";
    if (lastName.trim().length === 0) errors["lastName"] = "Last name is required.";

    const emailErr = validateEmail(email);
    if (emailErr !== undefined) errors["email"] = emailErr;

    const pwResult = validatePassword(password);
    if (!pwResult.valid) errors["password"] = pwResult.violations[0] ?? "Invalid password.";

    if (password !== confirmPassword) errors["confirmPassword"] = "Passwords do not match.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [firstName, lastName, email, password, confirmPassword]);

  const handleSubmit = useCallback(async (e: { preventDefault(): void }): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(undefined);

    const request: RegisterRequest = {
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: defaultRole,
      companyId: defaultCompanyId,
    };

    try {
      const registerResult = await authService.register(request);

      if (!registerResult.ok) {
        setServerError(registerResult.reason);
        return;
      }

      const loginResult = await authService.login({ email: email.trim(), password });

      if (loginResult.ok) {
        onSuccess(loginResult.value);
      } else {
        setServerError(loginResult.reason);
      }
    } finally {
      setLoading(false);
    }
  }, [authService, email, password, firstName, lastName, defaultRole, defaultCompanyId, validate, onSuccess]);

  return (
    <AuthLayout>
      <AuthCard>
        <motion.form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-white">Create your account</h1>
            <p className="text-sm text-zinc-500">Get started with KDOS.</p>
          </div>

          <AnimatePresence mode="wait">
            {serverError !== undefined && (
              <motion.div
                key="reg-error"
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {serverError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">First name</label>
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                disabled={loading}
                placeholder="Jane"
                aria-invalid={fieldErrors["firstName"] !== undefined ? "true" : "false"}
                className={[
                  "w-full rounded-lg border bg-[#27272a] px-3.5 py-2.5 text-sm text-white outline-none",
                  "placeholder:text-zinc-500 transition-colors",
                  "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  fieldErrors["firstName"] !== undefined ? "border-red-500/70" : "border-white/10",
                ].join(" ")}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {fieldErrors["firstName"] !== undefined && (
                <p className="text-xs text-red-400">{fieldErrors["firstName"]}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Last name</label>
              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                disabled={loading}
                placeholder="Smith"
                aria-invalid={fieldErrors["lastName"] !== undefined ? "true" : "false"}
                className={[
                  "w-full rounded-lg border bg-[#27272a] px-3.5 py-2.5 text-sm text-white outline-none",
                  "placeholder:text-zinc-500 transition-colors",
                  "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  fieldErrors["lastName"] !== undefined ? "border-red-500/70" : "border-white/10",
                ].join(" ")}
                onChange={(e) => setLastName(e.target.value)}
              />
              {fieldErrors["lastName"] !== undefined && (
                <p className="text-xs text-red-400">{fieldErrors["lastName"]}</p>
              )}
            </div>
          </div>

          <EmailField
            value={email}
            onChange={(v) => { setEmail(v); }}
            error={fieldErrors["email"]}
            disabled={loading}
          />

          <PasswordField
            value={password}
            onChange={(v) => setPassword(v)}
            error={fieldErrors["password"]}
            disabled={loading}
            label="Password"
            autoComplete="new-password"
          />

          <PasswordField
            value={confirmPassword}
            onChange={(v) => setConfirmPassword(v)}
            error={fieldErrors["confirmPassword"]}
            disabled={loading}
            label="Confirm password"
            autoComplete="new-password"
          />

          <motion.button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={[
              "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all",
              "bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1c1c1f]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {loading ? "Creating account…" : "Create account"}
          </motion.button>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onLogin(); }}
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Sign in
            </a>
          </p>
        </motion.form>
      </AuthCard>
    </AuthLayout>
  );
}