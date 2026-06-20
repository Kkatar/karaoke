/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          dark: '#121212',
          light: '#282828',
          hover: '#1ed760'
        },
        forest: {
          950: '#040d06',
          900: '#071b0c',
          800: '#0f3219',
          700: '#1a4e29',
          600: '#236938',
          emerald: '#10b981'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
