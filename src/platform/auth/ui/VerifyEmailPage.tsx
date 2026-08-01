import { useState } from "react";

interface VerifyEmailPageProps {
  email: string;
  onVerified: () => void;
  onBackToLogin: () => void;
  onVerify: (
    email: string,
    code: string,
  ) => Promise<boolean>;
  onResend: () => Promise<void> | void;
}

export function VerifyEmailPage({
  email,
  onVerified,
  onBackToLogin,
  onVerify,
  onResend,
}: VerifyEmailPageProps): JSX.Element {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = async (): Promise<void> => {
    if (code.trim().length !== 6) {
      setMessage("Enter the 6-digit verification code.");
      return;
    }

    try {
      setVerifying(true);
      setMessage("");

      const verified = await onVerify(
        email,
        code.trim(),
      );

      if (!verified) {
        setMessage(
          "That verification code is invalid or has expired.",
        );
        return;
      }

      setMessage("Email verified successfully.");
      onVerified();
    } catch (error) {
      console.error(
        "[KDOS] Email verification failed:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify your email.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    try {
      setResending(true);
      setMessage("");

      await onResend();

      setMessage(
        "A new verification code has been sent.",
      );
    } catch (error) {
      console.error(
        "[KDOS] Failed to resend verification code:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to resend the verification code.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0B] px-6 text-white">
      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-400">
              KDOS
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Verify your email
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              We sent a verification code to:
            </p>

            <p className="mt-1 break-all text-sm font-medium text-white">
              {email}
            </p>
          </div>

          <label
            htmlFor="verification-code"
            className="block text-sm font-medium text-zinc-300"
          >
            Verification code
          </label>

          <input
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            disabled={verifying}
            onChange={(event) => {
              const value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 6);

              setCode(value);
              setMessage("");
            }}
            placeholder="000000"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-xl tracking-[0.5em] text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {message && (
            <p
              className="mt-3 text-sm text-zinc-400"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleVerify()}
            disabled={
              verifying ||
              code.length !== 6
            }
            className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {verifying
              ? "Verifying..."
              : "Verify email"}
          </button>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending || verifying}
            className="mt-4 w-full text-sm text-zinc-400 transition hover:text-white disabled:opacity-50"
          >
            {resending
              ? "Sending..."
              : "Resend verification code"}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            disabled={verifying}
            className="mt-6 w-full text-sm text-zinc-500 transition hover:text-zinc-300 disabled:opacity-50"
          >
            Back to login
          </button>
        </div>
      </section>
    </main>
  );
}
