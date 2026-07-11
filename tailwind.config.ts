import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // shadcn/ui semantic tokens — mapped onto this app's existing dark-theme
      // CSS variables (src/index.css) instead of introducing a parallel palette.
      colors: {
        border:  "var(--color-border)",
        input:   "var(--color-border)",
        ring:    "var(--color-brand)",
        background: "var(--color-bg-base)",
        foreground: "var(--color-text-primary)",
        primary: {
          DEFAULT:    "var(--color-brand)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT:    "var(--color-bg-elevated)",
          foreground: "var(--color-text-primary)",
        },
        popover: {
          DEFAULT:    "var(--color-bg-elevated)",
          foreground: "var(--color-text-primary)",
        },
        card: {
          DEFAULT:    "var(--color-bg-card)",
          foreground: "var(--color-text-primary)",
        },
        muted: {
          DEFAULT:    "var(--color-bg-elevated)",
          foreground: "var(--color-text-muted)",
        },
        accent: {
          DEFAULT:    "var(--color-bg-elevated)",
          foreground: "var(--color-text-primary)",
        },
        destructive: {
          DEFAULT:    "var(--color-critical)",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
