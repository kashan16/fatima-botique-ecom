// tailwind.config.ts
import type { Config } from "tailwindcss";

/**
 * Helper so Tailwind's opacity utilities (e.g. bg-primary/50) work with CSS variables.
 * Usage: color: withOpacity('--my-var')
 */
const withOpacity =
  (variable: string) =>
  ({ opacityValue }: { opacityValue?: number | string }) =>
    opacityValue !== undefined
      ? `hsl(var(${variable}) / ${opacityValue})`
      : `hsl(var(${variable}))`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}", // For shadcn
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        /* CSS variable-based colors (use withOpacity to support /opacity utilities) */
        border: withOpacity("--border"),
        input: withOpacity("--input"),
        ring: withOpacity("--ring"),
        background: withOpacity("--background"),
        foreground: withOpacity("--foreground"),

        /* semantic colors built from CSS variables */
        primary: {
          DEFAULT: withOpacity("--primary"),
          foreground: withOpacity("--primary-foreground"),
        },
        secondary: {
          DEFAULT: withOpacity("--secondary"),
          foreground: withOpacity("--secondary-foreground"),
        },
        accent: {
          DEFAULT: withOpacity("--accent"),
          foreground: withOpacity("--accent-foreground"),
        },
        muted: {
          DEFAULT: withOpacity("--muted"),
          foreground: withOpacity("--muted-foreground"),
        },

        /* Extra static pastel swatches (hex fallbacks / extras) */
        "pastel-pink": "#FADDE1",
        "pastel-green": "#D4EDDA",
        "pastel-blue": "#D7EEF7",
        "pastel-lavender": "#E8DFF8",
        cream: "#FDF9F3",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        // Make sure you import these fonts in your global CSS (or use local fonts)
        sans: ['"Playfair Display"', "serif"],
        serif: ['"Playfair Display"', "serif"],
        // If you prefer an actual sans: uncomment next line and adjust above
        // sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  // optional: enable dark mode if you plan to toggle it (class or media)
  // darkMode: 'class',
};

export default config;
