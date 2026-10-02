import { colors, fonts, type } from './src/theme/tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: { sans: fonts.sans, mono: fonts.sans },
      fontSize: type,
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          to: { transform: 'rotate(360deg)' },
        },
        drift: {
          '0%': { transform: 'scale(1.02) translate(0, 0)' },
          '100%': { transform: 'scale(1.08) translate(-2%, -1.5%)' },
        },
        'queue-pulse': {
          '0%, 100%': { borderColor: 'rgba(212,163,89,0.85)' },
          '50%': { borderColor: 'rgba(212,163,89,0.3)' },
        },
        'node-pulse': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '0.3' },
        },
      },
      animation: {
        breathe: 'breathe 2.4s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
        drift: 'drift 9s ease-in-out infinite alternate',
        'queue-pulse': 'queue-pulse 1.8s ease-in-out infinite',
        'node-pulse': 'node-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
