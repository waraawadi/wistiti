import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--color-primary)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-white)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-white)",
        },
        destructive: {
          DEFAULT: "color-mix(in srgb, red 75%, black)",
          foreground: "var(--color-white)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-primary-light)",
          foreground: "var(--color-primary)",
        },
        popover: {
          DEFAULT: "var(--background)",
          foreground: "var(--foreground)",
        },
        card: {
          DEFAULT: "var(--background)",
          foreground: "var(--foreground)",
        },
        sidebar: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-white)",
          primary: "var(--color-primary)",
          "primary-foreground": "var(--color-white)",
          accent: "var(--color-secondary-light)",
          "accent-foreground": "var(--color-secondary)",
          border: "var(--border)",
          ring: "var(--color-primary)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [animate],
};

export default config;
