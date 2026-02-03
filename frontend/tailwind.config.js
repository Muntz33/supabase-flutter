/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#050505',
          paper: '#0A0A0A',
          subtle: '#121212',
        },
        emerald: {
          glow: 'rgba(16, 185, 129, 0.5)',
        },
        blood: {
          DEFAULT: '#9F1239',
          light: '#BE123C',
        },
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        }
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.8 },
          '50%': { transform: 'scale(1.05)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
