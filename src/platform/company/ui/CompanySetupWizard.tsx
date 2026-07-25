import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CompanyDetailsStep } from "./CompanyDetailsStep";
import type { CompanyDetailsData } from "./CompanyDetailsStep";
import { CompanyLogoStep } from "./CompanyLogoStep";
import type { LogoFileGateway } from "./CompanyLogoStep";
import { CompanyCompleteStep } from "./CompanyCompleteStep";
import type { CompanyService } from "../services/CompanyService";
import type { Company } from "../models/Company";

type WizardStep = "details" | "logo" | "complete";

interface CompanySetupWizardProps {
  readonly companyService: CompanyService;
  readonly fileGateway: LogoFileGateway;
  readonly onComplete: (company: Company) => void;
}

const STEP_LABELS: Record<WizardStep, string> = {
  details: "Company Details",
  logo: "Logo",
  complete: "Complete",
};

const STEPS: WizardStep[] = ["details", "logo", "complete"];

function StepIndicator({
  current,
}: {
  readonly current: WizardStep;
}): JSX.Element {
  const currentIndex = STEPS.indexOf(current);

  return (
    <nav className="flex items-center gap-0" aria-label="Setup progress">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = step === current;

        return (
          <div className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done
                    ? "bg-indigo-600 text-white"
                    : active
                    ? "bg-indigo-600/20 border border-indigo-500 text-indigo-400"
                    : "bg-[#27272a] border border-white/10 text-zinc-600",
                ].join(" ")}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden width={12} height={12}>
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={[
                  "text-xs font-medium",
                  active ? "text-indigo-400" : done ? "text-zinc-400" : "text-zinc-600",
                ].join(" ")}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  "mx-3 mb-5 h-px w-12 transition-colors",
                  done ? "bg-indigo-600" : "bg-white/10",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function CompanySetupWizard({
  companyService,
  fileGateway,
  onComplete,
}: CompanySetupWizardProps): JSX.Element {
  const [step, setStep] = useState<WizardStep>("details");
  const [detailsData, setDetailsData] = useState<CompanyDetailsData | undefined>(undefined);
  const [logoPath, setLogoPath] = useState<string | undefined>(undefined);
  const [createdCompany, setCreatedCompany] = useState<Company | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const handleDetailsNext = useCallback((data: CompanyDetailsData): void => {
    setDetailsData(data);
    setStep("logo");
  }, []);

  const handleLogoNext = useCallback(async (selectedLogoPath: string | undefined): Promise<void> => {
    if (detailsData === undefined) return;

    setLogoPath(selectedLogoPath);
    setSubmitting(true);
    setServerError(undefined);

    try {
      const result = await companyService.completeOnboarding({
        companyName: detailsData.companyName,
        registrationNumber: detailsData.registrationNumber,
        vatNumber: detailsData.vatNumber,
        email: detailsData.email,
        phone: detailsData.phone,
        address: detailsData.address,
        logoPath: selectedLogoPath,
      });

      if (result.ok) {
        setCreatedCompany(result.value.company);
        setStep("complete");
      } else {
        setServerError(result.reason);
      }
    } finally {
      setSubmitting(false);
    }
  }, [companyService, detailsData]);

  const handleComplete = useCallback((): void => {
    if (createdCompany !== undefined) {
      onComplete(createdCompany);
    }
  }, [createdCompany, onComplete]);

  const slideVariants = {
    enter: { opacity: 0, x: 32 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -32 },
  };

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center bg-[#111113] px-4 py-12"
      role="main"
    >
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-2xl font-bold tracking-tight text-white">KDOS</span>
          <h1 className="text-xl font-semibold text-white">Set up your company</h1>
          <p className="text-sm text-zinc-500">
            Complete the steps below to configure KDOS for your organisation.
          </p>
        </div>

        <div className="flex justify-center">
          <StepIndicator current={step} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-white/[0.06] bg-[#1c1c1f] p-8 shadow-2xl shadow-black/60"
        >
          {serverError !== undefined && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {serverError}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.div
                key="details"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22 }}
              >
                <CompanyDetailsStep
                  initial={detailsData ?? {}}
                  onNext={handleDetailsNext}
                />
              </motion.div>
            )}

            {step === "logo" && (
              <motion.div
                key="logo"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22 }}
              >
                <CompanyLogoStep
                  initialLogoPath={logoPath}
                  onNext={(path) => { void handleLogoNext(path); }}
                  onBack={() => setStep("details")}
                  fileGateway={fileGateway}
                />
                {submitting && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx={12} cy={12} r={10} />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    Creating company…
                  </div>
                )}
              </motion.div>
            )}

            {step === "complete" && createdCompany !== undefined && (
              <motion.div
                key="complete"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22 }}
              >
                <CompanyCompleteStep
                  company={createdCompany}
                  onComplete={handleComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}