import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { traceImage } from '../shapes.js';
import { findFinish } from '../data.js';

const GRID = 40;

/** Upload a logo or picture; its outline becomes the shell and its colour picks the nearest finish. */
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

  const trace = (t) => {
    if (!pixels.current) return;
    const r = traceImage(pixels.current, GRID, t);
    setResult(r);
    if (r.d) onChange({ shape: { id: 'image', name: 'Your image', code: 'IMG', mode: 'fill', d: r.d, source: 'image' }, finishId: r.finishId });
  };

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = GRID;
      const ctx = c.getContext('2d');
      const s = GRID / Math.max(img.width, img.height);
      ctx.drawImage(img, (GRID - img.width * s) / 2, (GRID - img.height * s) / 2, img.width * s, img.height * s);
      pixels.current = ctx.getImageData(0, 0, GRID, GRID).data;
      trace(threshold);
    };
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div className="flex flex-col gap-4">
      <label
        className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-canvas p-4 text-center transition-colors ${drag ? 'border-accent' : 'border-line hover:border-accent/60'}`}
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
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => load(e.target.files[0])} />
        {src ? (
          <img src={src} alt="Your uploaded reference" className="max-h-[170px] max-w-full object-contain" />
        ) : (
          <>
            <Icon name="upload" size={26} className="text-muted" />
            <span className="text-title text-ink">Upload a logo, symbol or picture</span>
            <span className="text-caption text-muted">PNG with a transparent or plain background works best</span>
          </>
        )}
      </label>

      {src && (
        <>
          <label className="flex flex-col gap-2">
            <span className="flex justify-between text-section text-muted">
              <span>Outline detail</span>
              <span className="text-ink">{threshold < 50 ? 'More' : threshold > 95 ? 'Less' : 'Balanced'}</span>
            </span>
            <input
              type="range" min="15" max="140" value={threshold}
              onChange={(e) => {
                setThreshold(Number(e.target.value));
                trace(Number(e.target.value));
              }}
              className="ds-range"
              style={{ '--pct': `${((threshold - 15) / 125) * 100}%` }}
            />
          </label>
          <p className="text-caption text-muted">
            {result?.d
              ? `Outline found. Colour matched to ${findFinish(result.finishId).name}; you can change it below.`
              : 'We couldn’t find a clear outline. Try a picture with a plain background, or move the slider.'}
          </p>
          <button className="btn-secondary h-9 self-start text-[13px]" onClick={() => { setSrc(null); setResult(null); pixels.current = null; }}>
            Remove image
          </button>
        </>
      )}
    </div>
  );
}
