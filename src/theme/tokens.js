// Design tokens — single source of truth.
// Low-chroma Material dark palette: deep slate surfaces, cool grey text,
// warm brass for active state and soft coral for warnings / stop.
// Consumed by tailwind.config.js and mirrored as CSS variables in src/index.css.

export const colors = {
  canvas: '#0B0F17', // Surface base
  surface: '#161C26', // Surface container: cards, search, sheets
  line: '#222A38', // 1px dividers
  ink: '#F1F5F9', // Primary text
  muted: '#8E9BAE', // Secondary text
  accent: '#D4A359', // Warm brass: active, selected, progress
  alert: '#E06D53', // Soft coral: warning, stop, loss
};

export const fonts = {
  sans: ['"Google Sans Flex"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
};

// Type scale (Google Sans Flex only; hierarchy from weight, optical size, width, tracking).
export const type = {
  header: ['20px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '500' }],
  section: ['12px', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
  title: ['15px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '500' }],
  body: ['14px', { lineHeight: '1.55', fontWeight: '400' }],
  metric: ['28px', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '400' }],
  caption: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
  tag: ['10px', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '600' }],
};
