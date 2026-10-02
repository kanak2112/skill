// Design tokens — single source of truth.
// Low-chroma dark palette with strict colour semantics:
//   brass = primary action / selection, teal = connection status,
//   amber = warning, coral = disconnect / loss.
// Consumed by tailwind.config.js and mirrored as CSS variables in src/index.css.

export const colors = {
  canvas: '#090D14', // Single app surface
  surface: '#131924', // Card surface: inputs, sheets, footage backing
  line: '#222A38', // 1px dividers
  ink: '#F1F5F9', // Primary text
  muted: '#8E9BAE', // Muted label (6.9:1 on canvas, passes WCAG AA)
  accent: '#E2B168', // Refined warm brass: primary action, selected state
  teal: '#5BBFBA', // Connection status
  amber: '#F2A65A', // Warning
  alert: '#E06D53', // Soft coral: disconnect, loss
};

export const fonts = {
  sans: ['"Google Sans Flex"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
};

// Type scale (Google Sans Flex only). `opsz` and `wdth` are set explicitly per role
// through font-variation-settings; see the type-* classes in src/index.css.
export const type = {
  screen: ['20px', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '500' }], // opsz 24
  section: ['13px', { lineHeight: '1.3', fontWeight: '500' }], // opsz 14
  title: ['15px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '500' }], // opsz 16
  body: ['14px', { lineHeight: '1.55', fontWeight: '400' }], // opsz 14
  metric: ['28px', { lineHeight: '1', fontWeight: '400' }], // opsz 28, wdth 75, tnum
  caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }], // opsz 12
  tag: ['11px', { lineHeight: '1', fontWeight: '500' }], // opsz 12
};

export const axes = {
  screen: { opsz: 24 },
  body: { opsz: 14 },
  metric: { opsz: 28, wdth: 75 },
};

// Three-step radius scale.
export const radii = {
  container: '16px', // device frame, sheets
  control: '8px', // cards, inputs, buttons
  pill: '9999px', // badges, status pills, suggestion chips
};

// Motion. Springs are integrated in JS (src/motion/spring.js) so the prototype
// matches the Figma / ProtoPie spring parameters exactly.
export const motion = {
  spring: { stiffness: 300, damping: 25, mass: 1 }, // carousel rotation, row changes, hold ring
  hold: { durationMs: 3000, releaseMs: 1100 }, // hold-to-stop countdown and ring drain
  sheet: { durationMs: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', enterY: '100%', backdropBlur: '16px' },
  haptics: { start: [12], tick: [18], complete: [30, 40, 70], cancel: [8] }, // navigator.vibrate patterns, ms
};
