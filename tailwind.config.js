/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-green': '#00d4aa',
        'medical-blue': '#0984e3',
        'warning-orange': '#ff7675',
        'navy': {
          DEFAULT: '#020810',
          50: '#edf2f9',
          100: '#d7e2f0',
          200: '#b8cde4',
          300: '#8cb0d3',
          400: '#5a8ebd',
          500: '#3972a4',
          600: '#285985',
          700: '#20476b',
          800: '#1b3d5a',
          900: '#0a192f',
          950: '#020810',
        },
        'card-bg': 'rgba(10, 20, 35, 0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
