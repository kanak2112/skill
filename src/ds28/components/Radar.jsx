import { useEffect, useRef, useState } from 'react';
import { TRAITS } from '../persona.js';

/** Tween numeric trait values so polygons morph smoothly between profiles. */
function useTween(target, ms = 700) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  const key = TRAITS.map((t) => target[t.id]).join(',');
  useEffect(() => {
    const start = performance.now();
    const a = { ...from.current };
    let raf = 0;
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      const e = 1 - (1 - k) ** 3;
      const next = Object.fromEntries(TRAITS.map((t) => [t.id, a[t.id] + (target[t.id] - a[t.id]) * e]));
      from.current = next;
      setV(next);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return v;
}

const C = 110;
const R = 78;
const pt = (i, val) => {
  const a = (Math.PI * 2 * i) / TRAITS.length - Math.PI / 2;
  return [C + Math.cos(a) * R * (val / 100), C + Math.sin(a) * R * (val / 100)];
};
const poly = (vals) => TRAITS.map((t, i) => pt(i, vals[t.id]).map((n) => n.toFixed(1)).join(',')).join(' ');

/** Six-axis trait radar: baseline in grey, evolved profile in the accent colour. */
export default function Radar({ base, evolved, color = 'var(--cyan)' }) {
  const b = useTween(base);
  const e = useTween(evolved ?? base);
  return (
    <svg viewBox="0 0 220 220" className="radar" role="img" aria-label="Trait profile radar chart">
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={poly(Object.fromEntries(TRAITS.map((t) => [t.id, r])))} className="radar-ring" />
      ))}
      {TRAITS.map((t, i) => {
        const [x, y] = pt(i, 100);
        const [lx, ly] = pt(i, 124);
        return (
          <g key={t.id}>
            <line x1={C} y1={C} x2={x} y2={y} className="radar-axis" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="radar-label">{t.label}</text>
          </g>
        );
      })}
      {evolved && <polygon points={poly(e)} className="radar-evolved" style={{ fill: color, stroke: color }} />}
      <polygon points={poly(b)} className="radar-base" />
      {evolved && TRAITS.map((t, i) => {
        const [x, y] = pt(i, e[t.id]);
        return <circle key={t.id} cx={x} cy={y} r="2.6" fill={color} />;
      })}
    </svg>
  );
}
