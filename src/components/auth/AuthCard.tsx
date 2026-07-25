import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AuthCardProps {
  readonly children?: ReactNode;
}

export function AuthCard({ children }: AuthCardProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#1c1c1f] p-8 shadow-2xl shadow-black/60"
    >
      {children}
    </motion.div>
  );
}