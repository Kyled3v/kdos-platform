import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AuthLayout } from "../../../components/auth/AuthLayout";
import { AuthCard } from "../../../components/auth/AuthCard";
import {
  EmailField,
  validateEmail,
} from "../../../components/auth/EmailField";
import { PasswordField } from "../../../components/auth/PasswordField";

import { validatePassword } from "../security/PasswordPolicy";

import type {
  AuthService,
  RegisterRequest,
} from "../services/AuthService";

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
  const [serverError, setServerError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required.";
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    const emailError = validateEmail(email);

    if (emailError !== undefined) {
      errors.email = emailError;
    }

    const passwordResult = validatePassword(password);

    if (!passwordResult.valid) {
      errors.password =
        passwordResult.violations[0] ?? "Invalid password.";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }, [
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
  ]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();

      if (loading) {
        return;
      }

      setServerError(undefined);

      if (!validate()) {
        return;
      }

      setLoading(true);

      try {
        const request: RegisterRequest = {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: defaultRole,
          companyId: defaultCompanyId,
        };

        console.log("[AUTH] Registering account:", request.email);

        const registerResult =
          await authService.register(request);

        console.log("[AUTH] Register result:", registerResult);

        if (!registerResult.ok) {
          setServerError(registerResult.reason);
          return;
        }

        console.log("[AUTH] Registration successful. Logging in...");

        const loginResult = await authService.login({
          email: email.trim(),
          password,
        });

        console.log("[AUTH] Login result:", loginResult);

        if (!loginResult.ok) {
          setServerError(loginResult.reason);
          return;
        }

        console.log("[AUTH] Authentication successful.");

        onSuccess(loginResult.value);
      } catch (error) {
        console.error("[AUTH] Registration failed:", error);

        setServerError(
          error instanceof Error
            ? error.message
            : "Unable to create the account. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      authService,
      defaultCompanyId,
      defaultRole,
      email,
      firstName,
      lastName,
      loading,
      onSuccess,
      password,
      validate,
    ]
  );

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
            <h1 className="text-xl font-semibold text-white">
              Create your account
            </h1>

            <p className="text-sm text-zinc-500">
              Get started with KDOS.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {serverError !== undefined && (
              <motion.div
                key="registration-error"
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {serverError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">
                First name
              </label>

              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                disabled={loading}
                placeholder="Jane"
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-[#27272a] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              />

              {fieldErrors.firstName && (
                <p className="text-xs text-red-400">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">
                Last name
              </label>

              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                disabled={loading}
                placeholder="Smith"
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-[#27272a] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              />

              {fieldErrors.lastName && (
                <p className="text-xs text-red-400">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <EmailField
            value={email}
            onChange={setEmail}
            error={fieldErrors.email}
            disabled={loading}
          />

          <PasswordField
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            disabled={loading}
            label="Password"
            autoComplete="new-password"
          />

          <PasswordField
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={fieldErrors.confirmPassword}
            disabled={loading}
            label="Confirm password"
            autoComplete="new-password"
          />

          <motion.button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1c1c1f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </motion.button>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onLogin}
              disabled={loading}
              className="font-medium text-indigo-400 transition-colors hover:text-indigo-300 disabled:opacity-50"
            >
              Sign in
            </button>
          </p>
        </motion.form>
      </AuthCard>
    </AuthLayout>
  );
}
