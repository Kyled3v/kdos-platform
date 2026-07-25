import { useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface PasswordFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly autoComplete?: string;
}

export function PasswordField({
  value,
  onChange,
  error,
  disabled = false,
  label = "Password",
  autoComplete = "current-password",
}: PasswordFieldProps): JSX.Element {
  const id = useId();
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);

  const displayError = touched ? error : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          aria-describedby={displayError !== undefined ? errorId : undefined}
          aria-invalid={displayError !== undefined ? "true" : "false"}
          aria-required="true"
          placeholder="••••••••••••"
          className={[
            "w-full rounded-lg border bg-[#27272a] px-3.5 py-2.5 pr-10 text-sm text-white outline-none",
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
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden width={16} height={16}>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden width={16} height={16}>
              <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={12} cy={12} r={3} />
            </svg>
          )}
        </button>
      </div>
      <AnimatePresence mode="wait">
        {displayError !== undefined && (
          <motion.p
            key="pw-error"
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