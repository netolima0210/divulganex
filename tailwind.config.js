/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E85D04',
        'primary-dark': '#C44B02',
        'primary-light': '#FF8534',
        accent: '#1A1A2E',
        'accent-light': '#2D2D4E',
        background: '#FAFAF8',
        surface: '#F2F0EB',
        border: '#E0DDD6',
        'text-secondary': '#5C5C5C',
        'text-disabled': '#A0A0A0',
      },
    },
  },
  plugins: [],
}

