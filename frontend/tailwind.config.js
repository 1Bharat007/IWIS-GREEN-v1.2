/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgLight: "#F6F8F7",
        bgDark: "#0B1210",
        surfaceLight: "#FFFFFF",
        surfaceDark: "#111827",
        accent: "#166534",
        accentSoft: "#22C55E",
      },
    },
  },
  plugins: [],
};
