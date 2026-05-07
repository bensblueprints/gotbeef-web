import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        bone: "#f5f3ee",
        paper: "#ffffff",
        rule: "#e6e2d6"
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.02em"
      },
      borderRadius: { sm: "2px" }
    }
  },
  plugins: []
};

export default config;
