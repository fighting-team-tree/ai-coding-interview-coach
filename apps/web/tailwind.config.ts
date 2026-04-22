import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-indigo": "#5e6ad2",
        "accent-violet": "#7170ff",
        "accent-hover": "#828fff",
        "security-lavender": "#7a7fad",
        "marketing-black": "#08090a",
        "marketing-deep": "#010102",
        "panel-dark": "#0f1011",
        "surface-3": "#191a1b",
        "surface-secondary": "#28282c",
        "text-primary": "#f7f8f8",
        "text-secondary": "#d0d6e0",
        "text-tertiary": "#8a8f98",
        "text-quaternary": "#62666d",
        "border-primary": "#23252a",
        "border-secondary": "#34343a",
        "border-tertiary": "#3e3e44",
        "border-subtle": "rgba(255, 255, 255, 0.05)",
        "border-standard": "rgba(255, 255, 255, 0.08)",
        "status-green": "#27a644",
        "status-emerald": "#10b981",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter Variable", "Inter", "system-ui", "sans-serif"],
        mono: ["Berkeley Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      letterSpacing: {
        "display-xl": "-1.584px",
        "display-large": "-1.408px",
        "display": "-1.056px",
        "h1": "-0.704px",
        "h2": "-0.288px",
        "h3": "-0.24px",
        "body-large": "-0.165px",
        "caption": "-0.13px",
      },
      borderRadius: {
        "micro": "2px",
        "standard": "4px",
        "comfortable": "6px",
        "card": "8px",
        "panel": "12px",
        "large": "22px",
        "pill": "9999px",
      },
      boxShadow: {
        "subtle": "rgba(0, 0, 0, 0.03) 0px 1.2px 0px",
        "inset": "rgba(0, 0, 0, 0.2) 0px 0px 12px 0px inset",
        "ring": "rgba(0, 0, 0, 0.2) 0px 0px 0px 1px",
        "elevated": "rgba(0, 0, 0, 0.4) 0px 2px 4px",
        "focus": "rgba(0, 0, 0, 0.1) 0px 4px 12px",
      }
    },
  },
  plugins: [],
};

export default config;