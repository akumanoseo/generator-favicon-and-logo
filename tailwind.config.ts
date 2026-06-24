import type { Config } from "tailwindcss";

/**
 * Akuma no SEO factory theme — dark UI, red accent, glassmorphism.
 * Mirrors the palette used by the existing landing page so the
 * generator feels like part of the same site.
 */
const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        akuma: {
          red: "#c0392b",
          redBright: "#e74c3c",
          dark: "#0a0a0a",
          darker: "#060606",
          card: "#111111",
          panel: "#0d0d0f",
          border: "#1e1e1e",
          muted: "#555555",
          light: "#e8e0d5",
        },
      },
      fontFamily: {
        display: ["var(--font-cinzel-decorative)", "Cinzel Decorative", "serif"],
        heading: ["var(--font-cinzel)", "Cinzel", "serif"],
        body: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.5)",
        glow: "0 0 24px rgba(231,57,44,0.35)",
        "glow-sm": "0 0 12px rgba(231,57,44,0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
