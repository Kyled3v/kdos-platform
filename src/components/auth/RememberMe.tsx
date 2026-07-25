import { useId } from "react";

interface RememberMeProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
}

export function RememberMe({
  checked,
  onChange,
  disabled = false,
}: RememberMeProps): JSX.Element {
  const id = useId();

  return (
    <div className="flex items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label="Remember me"
        className={[
          "h-4 w-4 rounded border-white/20 bg-[#27272a]",
          "accent-indigo-500 cursor-pointer",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label
        htmlFor={id}
        className="cursor-pointer select-none text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        Remember me for 30 days
      </label>
    </div>
  );
}