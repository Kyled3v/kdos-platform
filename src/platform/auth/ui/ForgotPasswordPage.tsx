import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthLayout } from "./AuthLayout";
import { AuthCard } from "./AuthCard";
import { EmailField, validateEmail } from "./EmailField";

interface ForgotPasswordPageProps {
  readonly onSubmit: (email: string) => Promise<void>;
  readonly onBack: () => void;
}

export function ForgotPasswordPage({
  onSubmit,
  onBack,
}: ForgotPasswordPageProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const handleSubmit = useCallback(async (e: { preventDefault(): void }): Promise<void> => {
    e.preventDefault();

    const err = validateEmail(email);
    setEmailError(err);
    if (err !== undefined) return;

    setLoading(true);
    setServerError(undefined);

    try {
      await onSubmit(email.trim());
      setSubmitted(true);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [email, onSubmit]);

  return (
    <AuthLayout>
      <AuthCard>
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-emerald-400" aria-hidden>
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Check your email</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  If an account exists for{" "}
                  <span className="text-zinc-200 font-medium">{email}</span>, you will receive
                  reset instructions shortly.
                </p>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                ← Back to sign in
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-white">Reset your password</h1>
                <p className="text-sm text-zinc-500">
                  Enter your email address and we&apos;ll send reset instructions.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {serverError !== undefined && (
                  <motion.div
                    key="fp-error"
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

              <EmailField
                value={email}
                onChange={(v) => { setEmail(v); setEmailError(validateEmail(v)); }}
                error={emailError}
                disabled={loading}
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
                {loading ? "Sending…" : "Send reset instructions"}
              </motion.button>

              <button
                type="button"
                onClick={onBack}
                className="text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← Back to sign in
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthCard>
    </AuthLayout>
  );
}