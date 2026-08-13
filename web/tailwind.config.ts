import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Fond de page. Blanc pur : `cream` garde son nom parce qu'il est
        // reference partout (bg-cream, text-cream sur les blocs sombres).
        cream: "#FFFFFF",
        surface: "#FFFFFF",
        ink: "#211C18",
        muted: "#726A61",
        line: "#E8E1D6",
        brand: { DEFAULT: "#C2502F", dark: "#A63F22", soft: "#F4E5DC" },
        emerald: { DEFAULT: "#1FA463", dark: "#178552", soft: "#E3F3EA" },
      },
      fontFamily: {
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(33,28,24,.04), 0 8px 24px rgba(33,28,24,.06)",
        lift: "0 10px 30px rgba(33,28,24,.10)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
