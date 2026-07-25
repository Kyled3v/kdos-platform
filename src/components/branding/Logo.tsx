import { APP_NAME, COMPANY_NAME } from "@/shared/constants/app";

/**
 * KDOS wordmark.
 *
 * Currently renders as text. When a custom uploaded logo becomes
 * available, only this file needs to change — every consumer
 * (Sidebar, Topbar, etc.) renders `<Logo />` and is agnostic to
 * whether the mark is text or an image.
 */

export interface LogoProps {
  readonly compact?: boolean;
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[15px] font-semibold tracking-tight text-[#F2F3F5]">
        {APP_NAME}
      </span>
      {!compact && (
        <span className="text-[11px] font-medium text-[#6B7280]">
          {COMPANY_NAME} Operating System
        </span>
      )}
    </div>
  );
}

export default Logo;

