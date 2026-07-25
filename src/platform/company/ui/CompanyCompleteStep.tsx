import { motion } from "framer-motion";
import type { Company } from "../models/Company";

interface CompanyCompleteStepProps {
  readonly company: Company;
  readonly onComplete: () => void;
}

export function CompanyCompleteStep({
  company,
  onComplete,
}: CompanyCompleteStepProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-400"
          aria-hidden
          width={32}
          height={32}
        >
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex flex-col gap-2"
      >
        <h3 className="text-xl font-semibold text-white">
          {company.companyName} is ready
        </h3>
        <p className="text-sm text-zinc-400 max-w-sm">
          Your company has been set up successfully. KDOS is now configured
          for your organisation.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="w-full rounded-xl border border-white/[0.06] bg-[#27272a] p-4 text-left"
      >
        <ul className="flex flex-col gap-2.5 text-sm">
          {([
            ["Company", company.companyName],
            ["Email", company.email],
            ["Phone", company.phone],
            ["Registration", company.registrationNumber || "—"],
            ["VAT", company.vatNumber || "—"],
          ] as [string, string][]).map(([label, value]) => (
            <li className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">{label}</span>
              <span className="text-zinc-200 font-medium text-right">{value}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.button
        type="button"
        onClick={onComplete}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1c1c1f] transition-colors"
      >
        Open KDOS
      </motion.button>
    </div>
  );
}