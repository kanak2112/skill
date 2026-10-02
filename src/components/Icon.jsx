/** Material Symbols Outlined glyph. `size` in px; `fill` for the solid variant. */
export default function Icon({ name, size = 18, fill = false, className = '', label }) {
  return (
    <span
      className={`icon ${fill ? 'icon-fill' : ''} ${className}`}
      style={{ fontSize: size }}
      aria-hidden={label ? undefined : 'true'}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  );
}
