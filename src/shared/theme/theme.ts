/**
 * KDOS design system tokens.
 *
 * A professional, enterprise-grade palette and scale set — no neon, no
 * gradients, no "AI product" styling. Consumed by layout and component
 * files as plain constants; no runtime theming engine lives here.
 */

export interface ThemeTypography {
  readonly fontFamily: string;
  readonly fontFamilyMono: string;
  readonly sizes: {
    readonly xs: string;
    readonly sm: string;
    readonly base: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
    readonly xxl: string;
  };
  readonly weights: {
    readonly regular: number;
    readonly medium: number;
    readonly semibold: number;
    readonly bold: number;
  };
  readonly lineHeights: {
    readonly tight: number;
    readonly normal: number;
    readonly relaxed: number;
  };
}

export interface ThemeSpacing {
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly xxl: string;
}

export interface ThemeRadius {
  readonly none: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly full: string;
}

export interface ThemeShadow {
  readonly none: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
}

export interface ThemeAnimationDurations {
  readonly instant: string;
  readonly fast: string;
  readonly normal: string;
  readonly slow: string;
}

export interface ThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly border: string;
  readonly borderSubtle: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly accent: string;
  readonly accentHover: string;
  readonly accentMuted: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
}

export interface Theme {
  readonly typography: ThemeTypography;
  readonly spacing: ThemeSpacing;
  readonly radius: ThemeRadius;
  readonly shadow: ThemeShadow;
  readonly animationDurations: ThemeAnimationDurations;
  readonly colors: ThemeColors;
}

export const typography: ThemeTypography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif',
  fontFamilyMono:
    '"SF Mono", "Cascadia Code", Consolas, monospace',
  sizes: {
    xs: "0.75rem",
    sm: "0.8125rem",
    base: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.375rem",
    xxl: "1.75rem",
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const spacing: ThemeSpacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  xxl: "3rem",
};

export const radius: ThemeRadius = {
  none: "0px",
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "9999px",
};

export const shadow: ThemeShadow = {
  none: "none",
  sm: "0 1px 2px rgba(0, 0, 0, 0.24)",
  md: "0 4px 12px rgba(0, 0, 0, 0.28)",
  lg: "0 12px 32px rgba(0, 0, 0, 0.36)",
};

export const animationDurations: ThemeAnimationDurations = {
  instant: "80ms",
  fast: "140ms",
  normal: "220ms",
  slow: "360ms",
};

export const colors: ThemeColors = {
  background: "#0B0C0E",
  surface: "#111318",
  surfaceRaised: "#171A20",
  border: "#242832",
  borderSubtle: "#1B1E25",
  textPrimary: "#F2F3F5",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",
  accent: "#3B82F6",
  accentHover: "#2563EB",
  accentMuted: "#1E3A8A",
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",
};

export const theme: Theme = {
  typography,
  spacing,
  radius,
  shadow,
  animationDurations,
  colors,
};

export default theme;

