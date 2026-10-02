// SYNAPTEK design tokens — single source of truth.
// Consumed by tailwind.config.js (utility classes) and mirrored as CSS
// variables in src/index.css for non-Tailwind contexts.

export const colors = {
  canvas: '#070A0F', // Deep Slate Black — background canvas
  surface: '#0D121D', // Instrument Panel Dark — cards
  hairline: '#1E293B', // 1px grid dividers / subtle borders
  frame: '#334155', // Focused / active outer frame
  cyan: '#06B6D4', // Active link / neural sync
  amber: '#F59E0B', // Impedance drift / residual trace
  red: '#EF4444', // Emergency decoherence / terminated
  ok: '#10B981', // Nominal / optimal readouts
  ink: '#F8FAFC', // Text primary
  muted: '#64748B', // Text muted
};

export const fonts = {
  mono: ['"JetBrains Mono"', '"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
};

export const tracking = {
  instrument: '0.15em',
  wide: '0.18em',
  brand: '0.2em',
  badge: '0.22em',
};
