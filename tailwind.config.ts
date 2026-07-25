import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#0A0A0B",
          raised: "#111113",
          panel: "#17171A",
          border: "#26262B",
        },
        accent: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          muted: "#1D4ED8",
        },
        ink: {
          primary: "#F5F5F7",
          secondary: "#A1A1AA",
          tertiary: "#6B6B70",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Inter", "sans-serif"],
      },
      backdropBlur: {
        glass: "20px",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;

