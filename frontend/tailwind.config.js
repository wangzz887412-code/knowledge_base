/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F5F0E6',
        'paper-dark': '#E8E0D0',
        ink: '#3D2914',
        'ink-light': '#5D4037',
        leather: '#8B5A2B',
        'leather-light': '#A0522D',
        gold: '#D4AF37',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
