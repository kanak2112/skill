import { useRef, useState } from 'react';
import { PRESETS, presetShape, strokesToPath } from '../shapes.js';
import { findFinish } from '../data.js';

/** Freehand pad (drawn strokes become a wire-form shell) plus one-tap vector primitives. */
export default function SketchInput({ design, onChange }) {
  const [strokes, setStrokes] = useState([]);
  const [live, setLive] = useState(null);
  const pad = useRef(null);
  const color = findFinish(design.finishId).ui;

  const point = (e) => {
    const r = pad.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  };

  const commit = (next) => {
    setStrokes(next);
    const d = strokesToPath(next);
    if (d) onChange({ shape: { id: 'sketch', name: 'Freehand Sigil', code: 'SKT', mode: 'stroke', strokeWidth: 9, d, source: 'sketch' } });
  };

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setLive([point(e)]);
  };
  const move = (e) => {
    if (!live) return;
    const p = point(e);
    const last = live[live.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.2) setLive([...live, p]);
  };
  const up = () => {
    if (!live) return;
    commit([...strokes, live]);
    setLive(null);
  };

  const raw = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + (pts.length === 1 ? ' l0.1 0' : '');

  return (
    <div className="sketch">
      <div className="sketch-pad-wrap">
        <svg
          ref={pad}
          className="sketch-pad"
          viewBox="0 0 100 100"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          role="img"
          aria-label="Sketch canvas. Draw with mouse, pen or finger."
        >
          <defs>
            <pattern id="padGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0H0V10" fill="none" stroke="#1d2333" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#padGrid)" />
          <circle cx="50" cy="50" r="36" fill="none" stroke="#1d2333" strokeDasharray="1 2" strokeWidth="0.4" />
          {[...strokes, ...(live ? [live] : [])].map((s, i) => (
            <path key={i} d={raw(s)} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {!strokes.length && !live && (
            <text x="50" y="52" textAnchor="middle" className="pad-hint">Draw your sigil here</text>
          )}
        </svg>
        <div className="sketch-actions">
          <button className="btn btn-ghost small" onClick={() => strokes.length && commit(strokes.slice(0, -1))} disabled={!strokes.length}>Undo</button>
          <button className="btn btn-ghost small" onClick={() => setStrokes([])} disabled={!strokes.length}>Clear</button>
          <span className="mono small muted">{strokes.length} stroke{strokes.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      <p className="mono small muted">VECTOR PRIMITIVES</p>
      <div className="primitives">
        {PRESETS.map((p) => {
          const on = design.shape.source !== 'sketch' && design.shape.id === p.id;
          return (
            <button
              key={p.id}
              className={`prim ${on ? 'active' : ''}`}
              onClick={() => onChange({ shape: { ...presetShape(p.id), source: 'vector' } })}
              aria-pressed={on}
              title={p.name}
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <path
                  d={p.d}
                  fill={p.mode === 'fill' ? 'currentColor' : 'none'}
                  stroke={p.mode === 'stroke' ? 'currentColor' : 'none'}
                  strokeWidth={p.strokeWidth}
                />
              </svg>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
