/**
 * Stand-in for src/components/Icon.jsx inside the standalone build: draws the vault's icons with
 * Lucide (the manual's icon set) instead of Material Symbols, so both halves share one icon style.
 */
const MAP = { search: 'Search', close: 'X', mic: 'Mic', check: 'Check', verified: 'BadgeCheck', add: 'Plus', remove: 'Minus', arrow_forward: 'ArrowRight', info: 'Info' };

export default function Icon({ name, size = 18, className = '', label }) {
  const C = (window.LucideReact || {})[MAP[name] || name];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };
  if (!C) return <span className={className} style={{ display: 'inline-block', width: size, height: size }} {...a11y} />;
  return <span className={`inline-flex shrink-0 ${className}`} {...a11y}><C size={size} strokeWidth={1.75} /></span>;
}
