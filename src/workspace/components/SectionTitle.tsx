import type { ReactElement } from "react";

export interface SectionTitleProps {
  readonly title: string;
  readonly subtitle?: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
      {subtitle && <p className="text-[14px] text-[#8B949E]">{subtitle}</p>}
    </div>
  );
}

