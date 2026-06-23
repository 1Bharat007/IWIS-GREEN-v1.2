/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        // Semantic tokens mirroring CSS vars for use in Tailwind classes
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-subtle": "var(--accent-subtle)",
        "accent-text": "var(--accent-text)",
        destructive: "var(--destructive)",
        "destructive-bg": "var(--destructive-bg)",
        warning: "var(--warning)",
        info: "var(--info)",
      },
      borderRadius: {
        DEFAULT: "8px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px" }],
        xs:   ["12px", { lineHeight: "16px" }],
        sm:   ["13px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "22px" }],
        md:   ["15px", { lineHeight: "24px" }],
        lg:   ["16px", { lineHeight: "24px" }],
        xl:   ["18px", { lineHeight: "28px" }],
        "2xl":["22px", { lineHeight: "32px" }],
        "3xl":["28px", { lineHeight: "36px" }],
        "4xl":["34px", { lineHeight: "42px" }],
        "5xl":["42px", { lineHeight: "50px" }],
      },
      spacing: {
        "4.5": "18px",
        "13": "52px",
        "15": "60px",
        "18": "72px",
      },
      boxShadow: {
        sm:  "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md:  "0 2px 8px 0 rgb(0 0 0 / 0.07)",
        none: "none",
      },
    },
  },
  plugins: [],
};
