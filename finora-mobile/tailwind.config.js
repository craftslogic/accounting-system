/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          dark: "#1D4ED8",
          muted: "#DBEAFE",
        },
        accent: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#059669",
        },
        finora: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          muted: "#F1F5F9",
          border: "#E2E8F0",
          text: "#0F172A",
          secondary: "#64748B",
          subtle: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};