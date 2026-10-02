// Design tokens — single source of truth.
// Consumed by tailwind.config.js and mirrored as CSS variables in src/index.css.

export const colors = {
  canvas: '#0F172A', // Dark slate
  surface: '#1E293B', // Elevated slate
  line: '#334155', // 1px dividers
  ink: '#F8FAFC', // Primary text
  muted: '#94A3B8', // Muted text
  accent: '#0EA5E9', // Active accent
  warning: '#F59E0B', // Amber
  alert: '#EF4444', // Red
};

export const fonts = {
  sans: ['"Google Sans Flex"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
};
