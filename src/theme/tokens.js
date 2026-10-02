// Design tokens — single source of truth.
// Low-chroma dark palette with strict colour semantics:
//   brass = primary action / selection, teal = connection status,
//   amber = warning, coral = disconnect / loss.
// Consumed by tailwind.config.js and mirrored as CSS variables in src/index.css.

export const colors = {
  canvas: '#090D14', // Single app surface
  surface: '#141A24', // Inputs, sheets, footage backing
  line: '#222A38', // 1px dividers
  ink: '#F1F5F9', // Primary text
  muted: '#94A3B8', // Secondary text (≥ 7:1 on canvas)
  accent: '#E2B168', // Refined warm brass: primary action, selected state
  teal: '#5BBFBA', // Connection status
  amber: '#F2A65A', // Warning
  alert: '#E06D53', // Soft coral: disconnect, loss
};

export const fonts = {
  sans: ['"Google Sans Flex"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
};

// Type scale (Google Sans Flex only; hierarchy from size, weight, width).
export const type = {
  app: ['16px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '500' }],
  display: ['22px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '450' }],
  section: ['13px', { lineHeight: '1.3', fontWeight: '500' }],
  title: ['15px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '500' }],
  body: ['14px', { lineHeight: '1.55', fontWeight: '400' }],
  metric: ['28px', { lineHeight: '1', fontWeight: '400' }],
  caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
  tag: ['11px', { lineHeight: '1', fontWeight: '500' }],
};

// Three-step radius scale.
export const radii = {
  container: '16px', // device frame, sheets
  control: '8px', // cards, inputs, buttons
  pill: '9999px', // badges, status pills, suggestion chips
};
