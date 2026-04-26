/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0A0A0F',
        'bg-secondary': '#12121A',
        'bg-card': '#1A1A27',
        'accent-violet': '#7C3AED',
        'accent-gold': '#F59E0B',
      }
    },
  },
  plugins: [],
}