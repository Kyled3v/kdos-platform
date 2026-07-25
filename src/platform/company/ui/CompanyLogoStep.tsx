import { useState, useCallback } from "react";
import { motion } from "framer-motion";

interface CompanyLogoStepProps {
  readonly initialLogoPath: string | undefined;
  readonly onNext: (logoPath: string | undefined) => void;
  readonly onBack: () => void;
}

interface LogoFileGateway {
  selectFile(): Promise<string | undefined>;
}

interface CompanyLogoStepWithGatewayProps extends CompanyLogoStepProps {
  readonly fileGateway: LogoFileGateway;
}

export function CompanyLogoStep({
  initialLogoPath,
  onNext,
  onBack,
  fileGateway,
}: CompanyLogoStepWithGatewayProps): JSX.Element {
  const [logoPath, setLogoPath] = useState<string | undefined>(initialLogoPath);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSelectFile = useCallback(async (): Promise<void> => {
    setSelecting(true);
    setError(undefined);
    try {
      const selected = await fileGateway.selectFile();
      if (selected !== undefined) {
        setLogoPath(selected);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select file.");
    } finally {
      setSelecting(false);
    }
  }, [fileGateway]);

  const handleClear = useCallback((): void => {
    setLogoPath(undefined);
    setError(undefined);
  }, []);

  const handleNext = useCallback((): void => {
    onNext(logoPath);
  }, [logoPath, onNext]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-white">Company Logo</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Upload your company logo. This step is optional.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {logoPath !== undefined ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative flex h-40 w-40 items-center justify-center rounded-2xl border border-white/10 bg-[#27272a] overflow-hidden"
          >
            <img
              src={logoPath}
              alt="Company logo preview"
              className="h-full w-full object-contain p-3"
            />
            <button
              type="button"
              aria-label="Remove logo"
              onClick={handleClear}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden width={12} height={12}>
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={[
              "flex h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed",
              "border-white/10 bg-[#27272a] transition-colors hover:border-indigo-500/50",
            ].join(" ")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500" aria-hidden width={32} height={32}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 3v12" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-zinc-500">
              PNG, JPG or SVG — max 2 MB
            </p>
          </motion.div>
        )}

        {error !== undefined && (
          <p className="text-sm text-red-400" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <motion.button
          type="button"
          onClick={handleSelectFile}
          disabled={selecting}
          whileTap={{ scale: 0.98 }}
          className={[
            "rounded-lg border border-white/10 bg-[#27272a] px-5 py-2.5 text-sm font-medium text-zinc-200",
            "hover:bg-[#303033] hover:border-white/20 transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
        >
          {selecting ? "Selecting…" : logoPath !== undefined ? "Change Logo" : "Select Logo"}
        </motion.button>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ← Back
        </button>
        <motion.button
          type="button"
          onClick={handleNext}
          whileTap={{ scale: 0.98 }}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1c1c1f] transition-colors"
        >
          {logoPath !== undefined ? "Continue" : "Skip for Now"}
        </motion.button>
      </div>
    </div>
  );
}

export type { LogoFileGateway };