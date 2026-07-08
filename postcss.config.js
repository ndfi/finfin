// Tailwind CSS v4: the PostCSS plugin moved to a separate package
// (@tailwindcss/postcss), and autoprefixer is now bundled in — no
// separate autoprefixer plugin needed anymore.
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
