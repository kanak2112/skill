import { useEffect, useRef, useState } from 'react';

const FILL_MS = 3200;
const DRAIN_PER_S = 0.45;
const R = 88;
const C = 2 * Math.PI * R;

const PHASES = [
  [0, 'Hold to begin coupling'],
  [0.01, 'Hydrating electrode gel'],
  [0.3, 'Matching epidermal impedance'],
  [0.6, 'Locking motor unit templates'],
  [0.9, 'Verifying signal floor'],
  [1, 'READY'],
];

/** Hold-to-calibrate: progress fills while pressed, drains when released, and locks at 100%. */
export default function CalibrationTab({ node, calibrated, onCalibrated }) {
  const [p, setP] = useState(calibrated ? 1 : 0);
  const [holding, setHolding] = useState(false);
  const raf = useRef(0);
  const last = useRef(0);
  const pRef = useRef(p);

  useEffect(() => {
    const tick = (t) => {
      const dt = last.current ? (t - last.current) / 1000 : 0;
      last.current = t;
      let next = pRef.current;
      if (holding) next = Math.min(1, next + (dt * 1000) / FILL_MS);
      else if (next < 1) next = Math.max(0, next - dt * DRAIN_PER_S);
      if (next !== pRef.current) {
        pRef.current = next;
        setP(next);
        if (next >= 1) {
          setHolding(false);
          onCalibrated(true);
          navigator.vibrate?.([30, 40, 60]);
          return;
        }
      }
      if (holding || (next > 0 && next < 1)) raf.current = requestAnimationFrame(tick);
    };
    last.current = 0;
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [holding, onCalibrated]);

  const ready = p >= 1;
  const phase = [...PHASES].reverse().find(([at]) => p >= at)[1];
  const ohm = 4.8 - (4.8 - node.ohm) * p;
  const snr = 3 + 28 * p;

  const start = (e) => {
    if (ready) return;
    e.preventDefault();
    setHolding(true);
  };
  const stop = () => setHolding(false);

  const reset = () => {
    pRef.current = 0;
    setP(0);
    onCalibrated(false);
  };

  return (
    <div className="panel-grid">
      <div>
        <h2 className="panel-title">Signal Calibration</h2>
        <p className="muted small">
          Press and hold the ring with the patch seated on the {node.name}. Releasing early drains the coupling gel cycle.
        </p>

        <div className="calib">
          <button
            className={`calib-btn ${holding ? 'holding' : ''} ${ready ? 'ready' : ''}`}
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && start(e)}
            onKeyUp={stop}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={ready ? 'Calibrated' : 'Hold to calibrate'}
          >
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r={R} className="calib-track" />
              {Array.from({ length: 60 }, (_, i) => (
                <line
                  key={i}
                  x1="100" y1="4" x2="100" y2={i % 5 ? 8 : 11}
                  transform={`rotate(${i * 6} 100 100)`}
                  className={i / 60 < p ? 'tick on' : 'tick'}
                />
              ))}
              <circle
                cx="100" cy="100" r={R}
                className="calib-ring"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - p)}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <span className="calib-center">
              <span className="mono calib-pct">{ready ? 'READY' : `${Math.round(p * 100)}%`}</span>
              <span className="small muted">{ready ? 'Epidermal coupling locked' : holding ? 'Coupling…' : 'Hold'}</span>
            </span>
          </button>
          <p className="mono small calib-phase" aria-live="polite">{phase}</p>
          {ready && <button className="btn btn-ghost small" onClick={reset}>Recalibrate</button>}
        </div>
      </div>

      <div className="stack">
        <div className="metric-grid">
          <div className="metric card-inset"><span className="small muted">Skin impedance</span><b className="mono">{ohm.toFixed(2)} kΩ</b><span className="small muted">target {node.ohm.toFixed(2)}</span></div>
          <div className="metric card-inset"><span className="small muted">Signal-to-noise</span><b className="mono">{snr.toFixed(1)} dB</b><span className="small muted">min 24 dB</span></div>
          <div className="metric card-inset"><span className="small muted">Electrodes seated</span><b className="mono">{Math.round(28 * p)}/28</b><span className="small muted">dry graphene</span></div>
          <div className="metric card-inset"><span className="small muted">Coupling</span><b className="mono">{(p * 100).toFixed(0)}%</b><span className="small muted">{ready ? 'locked' : 'unlocked'}</span></div>
        </div>
        <ol className="checklist small card-inset">
          <li className={p > 0 ? 'done' : ''}>Clean the site with the included isopropyl wipe; let it dry 30 s.</li>
          <li className={p >= 0.3 ? 'done' : ''}>Seat the shell flush. The ring should sit flat with no edge lift.</li>
          <li className={p >= 0.6 ? 'done' : ''}>Relax the target muscle. Calibration reads resting tone.</li>
          <li className={ready ? 'done' : ''}>Wait for READY before renting a stream.</li>
        </ol>
      </div>
    </div>
  );
}
