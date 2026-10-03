import { useRef, useState } from 'react';
import { PRESETS, presetShape, strokesToPath } from '../shapes.js';

/** Draw a shape by hand, or start from one of the ready-made shapes. */
export default function SketchInput({ design, onChange }) {
  const [strokes, setStrokes] = useState([]);
  const [live, setLive] = useState(null);
  const pad = useRef(null);

  const point = (e) => {
    const r = pad.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  };
  const commit = (next) => {
    setStrokes(next);
    const d = strokesToPath(next);
    if (d) onChange({ shape: { id: 'sketch', name: 'Your sketch', code: 'SKT', mode: 'stroke', strokeWidth: 9, d, source: 'sketch' } });
  };
  const raw = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + (pts.length === 1 ? ' l0.1 0' : '');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-section text-muted">Start from a shape</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {PRESETS.map((p) => {
            const on = design.shape.source !== 'sketch' && design.shape.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onChange({ shape: { ...presetShape(p.id), source: 'shape' } })}
                aria-pressed={on}
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2.5 text-caption transition-colors ${on ? 'border-accent bg-accent/10 text-ink' : 'border-line text-muted hover:text-ink'}`}
              >
                <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true">
                  <path d={p.d} fill={p.mode === 'fill' ? 'currentColor' : 'none'} stroke={p.mode === 'stroke' ? 'currentColor' : 'none'} strokeWidth={p.strokeWidth} />
                </svg>
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-section text-muted">Or draw your own</p>
        <svg
          ref={pad}
          viewBox="0 0 100 100"
          className="mx-auto block aspect-square w-full max-w-[320px] cursor-crosshair touch-none rounded-lg border border-line bg-canvas"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setLive([point(e)]);
          }}
          onPointerMove={(e) => {
            if (!live) return;
            const p = point(e);
            const last = live[live.length - 1];
            if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.2) setLive([...live, p]);
          }}
          onPointerUp={() => {
            if (live) commit([...strokes, live]);
            setLive(null);
          }}
          onPointerCancel={() => setLive(null)}
          role="img"
          aria-label="Drawing area. Draw with a mouse, pen or finger."
        >
          <circle cx="50" cy="50" r="38" fill="none" stroke="#222A38" strokeDasharray="1.5 2" strokeWidth="0.4" />
          {[...strokes, ...(live ? [live] : [])].map((s, i) => (
            <path key={i} d={raw(s)} fill="none" stroke="#E2B168" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {!strokes.length && !live && (
            <text x="50" y="51.5" textAnchor="middle" fontSize="4.2" fill="#8E9BAE">Draw inside the circle</text>
          )}
        </svg>
        <div className="mt-2 flex items-center justify-center gap-2">
          <button className="btn-secondary h-9 text-[13px]" onClick={() => commit(strokes.slice(0, -1))} disabled={!strokes.length}>Undo</button>
          <button className="btn-secondary h-9 text-[13px]" onClick={() => setStrokes([])} disabled={!strokes.length}>Clear</button>
        </div>
      </div>
    </div>
  );
}
