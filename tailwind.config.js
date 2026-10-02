import { colors, fonts, tracking } from './src/theme/tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { syn: colors },
      fontFamily: fonts,
      letterSpacing: tracking,
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
      },
      boxShadow: {
        none: 'none',
      },
      keyframes: {
        'pulse-hard': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-hard': 'pulse-hard 1.4s steps(2, jump-none) infinite',
        'pulse-fast': 'pulse-hard 0.8s steps(2, jump-none) infinite',
        scan: 'scan 2.4s linear infinite',
        blink: 'blink 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
};
