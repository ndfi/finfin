/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"],
      },
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        forest: "var(--forest)",
        gold: "var(--gold)",
        "gold-dark": "var(--gold-dark)",
        teal: "var(--teal)",
        "teal-dark": "var(--teal-dark)",
        brick: "var(--brick)",
      },
    },
  },
  plugins: [],
};
