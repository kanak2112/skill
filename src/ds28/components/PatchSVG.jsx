import { useId } from 'react';

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => {
    const v = (n >> s) & 255;
    return Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  };
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

const LIGHT = {
  gloss: { constant: 1.25, exponent: 26, surface: 4.5, rim: 0.55 },
  satin: { constant: 0.7, exponent: 12, surface: 3, rim: 0.25 },
  matte: { constant: 0.28, exponent: 6, surface: 2, rim: 0 },
};

/**
 * Renders a patch shell with a bevelled, lit finish. Extra props pass to the root <svg>,
 * so it can be placed standalone or nested inside another SVG via x / y / width / height.
 */
export default function PatchSVG({ shape, color, coating = 'gloss', glow = 0, stealth = false, title, ...rest }) {
  const uid = useId().replace(/:/g, '');
  const L = LIGHT[coating] ?? LIGHT.gloss;
  const grad = `g${uid}`;
  const bevel = `b${uid}`;
  const sw = shape.strokeWidth ?? 9;
  const paint = shape.mode === 'stroke'
    ? { fill: 'none', stroke: `url(#${grad})`, strokeWidth: sw, strokeLinecap: shape.cap ?? 'round', strokeLinejoin: shape.cap === 'butt' ? 'miter' : 'round' }
    : { fill: `url(#${grad})` };

  return (
    <svg
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-label={title}
      style={{
        overflow: 'visible',
        filter: glow > 0 ? `drop-shadow(0 0 ${2 + glow * 6}px ${color}) drop-shadow(0 0 ${glow * 14}px ${color}99)` : undefined,
        opacity: stealth ? 0.55 : 1,
        transition: 'filter 400ms ease, opacity 400ms ease',
      }}
      {...rest}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={stealth ? shade('#334155', 0.15) : shade(color, coating === 'matte' ? 0.12 : 0.35)} />
          <stop offset="0.5" stopColor={stealth ? '#263042' : color} />
          <stop offset="1" stopColor={stealth ? '#121722' : shade(color, -0.55)} />
        </linearGradient>
        <filter id={bevel} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="blur" />
          <feSpecularLighting
            in="blur"
            surfaceScale={L.surface}
            specularConstant={stealth ? 0.2 : L.constant}
            specularExponent={L.exponent}
            lightingColor="#ffffff"
            result="spec"
          >
            <fePointLight x="18" y="-24" z="70" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
        </filter>
      </defs>
      <g filter={`url(#${bevel})`}>
        <path d={shape.d} {...paint} fillRule="nonzero" />
      </g>
      {L.rim > 0 && !stealth && (
        <path
          d={shape.d}
          fill="none"
          stroke={`rgba(255,255,255,${L.rim})`}
          strokeWidth={shape.mode === 'stroke' ? 0.8 : 0.6}
          strokeLinecap={shape.cap ?? 'round'}
          style={{ mixBlendMode: 'screen' }}
          transform={shape.mode === 'stroke' ? 'translate(-1.2 -1.2)' : undefined}
        />
      )}
    </svg>
  );
}
