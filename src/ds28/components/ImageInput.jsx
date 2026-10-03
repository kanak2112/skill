import { useEffect, useRef, useState } from 'react';
import { traceImage } from '../shapes.js';
import { findFinish } from '../data.js';

const GRID = 40;

/** Upload a reference image; it is traced to a 40 × 40 silhouette and snapped to the nearest finish. */
export default function ImageInput({ onChange }) {
  const [src, setSrc] = useState(null);
  const [threshold, setThreshold] = useState(60);
  const [result, setResult] = useState(null);
  const [drag, setDrag] = useState(false);
  const pixels = useRef(null);

  const load = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = GRID;
      const ctx = c.getContext('2d');
      const s = GRID / Math.max(img.width, img.height);
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, (GRID - w) / 2, (GRID - h) / 2, w, h);
      pixels.current = ctx.getImageData(0, 0, GRID, GRID).data;
      trace(threshold);
    };
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const trace = (t) => {
    if (!pixels.current) return;
    const r = traceImage(pixels.current, GRID, t);
    setResult(r);
    if (r.d) {
      onChange({
        shape: { id: 'image', name: 'Traced Emblem', code: 'IMG', mode: 'fill', d: r.d, source: 'image' },
        finishId: r.finishId,
      });
    }
  };

  return (
    <div className="imagein">
      <label
        className={`dropzone ${drag ? 'drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          load(e.dataTransfer.files[0]);
        }}
      >
        <input type="file" accept="image/*" onChange={(e) => load(e.target.files[0])} hidden />
        {src ? (
          <img src={src} alt="Reference upload" />
        ) : (
          <>
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>Drop a logo, glyph or photo</span>
            <span className="mono small muted">PNG with transparency traces best</span>
          </>
        )}
      </label>

      {src && (
        <>
          <label className="slider-row">
            <span className="small">Trace sensitivity</span>
            <input
              type="range"
              min="15"
              max="140"
              value={threshold}
              style={{ '--fill': `${((threshold - 15) / 125) * 100}%`, '--acc': '#00f0ff' }}
              onChange={(e) => {
                const t = Number(e.target.value);
                setThreshold(t);
                trace(t);
              }}
            />
            <span className="mono small">{threshold}</span>
          </label>
          {result && (
            <p className="mono small muted">
              {result.d
                ? `Silhouette coverage ${(result.coverage * 100).toFixed(0)}% · snapped to ${findFinish(result.finishId).name}`
                : 'No clear silhouette found. Adjust sensitivity or try an image with a plain background.'}
            </p>
          )}
          <button className="btn btn-ghost small" onClick={() => { setSrc(null); setResult(null); pixels.current = null; }}>
            Remove image
          </button>
        </>
      )}
    </div>
  );
}
