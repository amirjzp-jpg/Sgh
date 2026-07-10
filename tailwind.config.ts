import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f4",
          100: "#dcf0e4",
          600: "#1d7a4f",
          700: "#166341",
          800: "#124f35",
          900: "#0e3f2b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
