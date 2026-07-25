import { useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface EmailFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  readonly disabled?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (email.length === 0) return "Email address is required.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return undefined;
}

export function EmailField({
  value,
  onChange,
  error,
  disabled = false,
}: EmailFieldProps): JSX.Element {
  const id = useId();
  const errorId = `${id}-error`;
  const [touched, setTouched] = useState(false);

  const displayError = touched ? error : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-300"
      >
        Email address
      </label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        value={value}
        disabled={disabled}
        aria-describedby={displayError !== undefined ? errorId : undefined}
        aria-invalid={displayError !== undefined ? "true" : "false"}
        aria-required="true"
        placeholder="you@company.com"
        className={[
          "w-full rounded-lg border bg-[#27272a] px-3.5 py-2.5 text-sm text-white outline-none",
          "placeholder:text-zinc-500 transition-colors duration-150",
          "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          displayError !== undefined
            ? "border-red-500/70 ring-2 ring-red-500/20"
            : "border-white/10 hover:border-white/20",
        ].join(" ")}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
      />
      <AnimatePresence mode="wait">
        {displayError !== undefined && (
          <motion.p
            key="email-error"
            id={errorId}
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-400"
          >
            {displayError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}