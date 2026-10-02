import { colors, fonts } from './src/theme/tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: { sans: fonts.sans, mono: fonts.sans },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          to: { transform: 'rotate(360deg)' },
        },
        'node-pulse': {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        breathe: 'breathe 2s ease-in-out infinite',
        shimmer: 'shimmer 3.2s linear infinite',
        'node-pulse': 'node-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
