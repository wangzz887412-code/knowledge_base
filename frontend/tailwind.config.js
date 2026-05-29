/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAF7F2',
        'paper-dark': '#F0EBE0',
        'paper-darker': '#E6DFD0',
        ink: '#2C2416',
        'ink-light': '#5C4A3A',
        'ink-muted': '#8C7B6C',
        leather: '#8B5A2B',
        'leather-light': '#A67B4D',
        'leather-dark': '#6B4226',
        gold: '#C4A44A',
        'gold-light': '#D4C080',
        accent: '#B8753A',
        'surface': '#FDFBF7',
        'surface-hover': '#F5F0E8',
        'border-light': 'rgba(0,0,0,0.06)',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'Noto Serif SC', 'serif'],
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)',
        'glass': '0 4px 24px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
    },
  },
  plugins: [],
}