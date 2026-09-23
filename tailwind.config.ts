import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fhenix: {
          dark: "#0b0f19",
          card: "#111827",
          border: "#1f2937",
          primary: "#f97316",
          cyan: "#06b6d4"
        }
      }
    },
  },
  plugins: [],
};
export default config;
