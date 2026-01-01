/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2fab9e',
          light: '#5fc5b8',
          dark: '#1d8a7d',
        },
      },
    },
  },
  plugins: [],
}