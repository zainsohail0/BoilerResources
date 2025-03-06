/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/tw-elements-react/dist/js/**/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

module.exports = {
  darkMode: 'class', // Enable dark mode using the 'class' strategy
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust the paths to your source files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};