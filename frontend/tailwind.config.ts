import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        // Orange Marketplace palette
        // Primary   #EA580C
        // Secondary #1F2937
        // Accent    #FBBF24
        // Background#FFF7ED
        // Surface   #FFFFFF
        primary: {
          DEFAULT: "#EA580C",
          50:  "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },
        secondary: {
          DEFAULT: "#1F2937",
          50:  "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#030712",
        },
        accent: {
          DEFAULT: "#FBBF24",
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },
        ink: {
          50:  "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
        success: { DEFAULT: "#10b981", foreground: "#ffffff" },
        warn:    { DEFAULT: "#F59E0B", foreground: "#1F2937" },
        danger:  { DEFAULT: "#EF4444", foreground: "#ffffff" },
        border:  "hsl(var(--border))",
        ring:    "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        surface: "hsl(var(--surface))",
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["clamp(3.5rem, 8vw, 6rem)",   { lineHeight: "1.02", letterSpacing: "-0.04em", fontWeight: "700" }],
        "display-xl":  ["clamp(2.75rem, 6vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "700" }],
        "display-lg":  ["clamp(2rem, 4vw, 3rem)",     { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-md":  ["clamp(1.5rem, 3vw, 2rem)",   { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
      backgroundImage: {
        "marketplace-gradient": "linear-gradient(135deg, #EA580C 0%, #F97316 45%, #FBBF24 100%)",
        "hero-warm":           "linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 100%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(234,88,12,.18), 0 8px 32px -8px rgba(234,88,12,.45)",
        soft: "0 1px 2px rgba(31,41,55,.04), 0 8px 24px -12px rgba(31,41,55,.08)",
        elev: "0 1px 3px rgba(31,41,55,.06), 0 24px 48px -16px rgba(31,41,55,.10)",
        warm: "0 8px 24px -8px rgba(234,88,12,.35)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      transitionTimingFunction: {
        "apple":  "cubic-bezier(0.28, 0.11, 0.32, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.28, 0.11, 0.32, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        shimmer:  "shimmer 2s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
