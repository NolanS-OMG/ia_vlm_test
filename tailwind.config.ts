import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f7fb",
          100: "#e9edf5",
          200: "#cfd8e8",
          300: "#a6b8d5",
          400: "#7d96bf",
          500: "#5b78ab",
          600: "#455f90",
          700: "#374b72",
          800: "#2f3f5f",
          900: "#2a364f"
        }
      },
      boxShadow: {
        glow: "0 10px 50px rgba(75, 119, 190, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
