import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';
import Wearable, { LED } from '../components/Wearable.jsx';
import { formatMMSS } from '../hooks/useSessionTimer.js';

const HISTORY = 28;

/** Simulated sensor: jitters around `base` and keeps a short history for the sparkline. */
function useLiveReading(base, spread, active, boost = 0) {
  const [series, setSeries] = useState(() => Array.from({ length: HISTORY }, () => base));
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      const next = base + (Math.random() - 0.5) * 2 * (spread + boost);
      setSeries((s) => [...s.slice(1), next]);
    }, 700);
    return () => clearInterval(id);
  }, [base, spread, active, boost]);
  return { value: active ? series[series.length - 1] : null, series };
}

function Sparkline({ series, min, max, tone }) {
  const w = 72;
  const h = 22;
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = h - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * h;
    return [x, y];
  });
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} className={`h-[26px] w-[76px] ${tone}`} aria-hidden="true">
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="currentColor" opacity="0.12" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.2" fill="currentColor" />
    </svg>
  );
}

function StatusBanner({ led, model }) {
  const meta = {
    cyan: { title: 'Skill active', tint: 'bg-cyan/10', dot: 'bg-cyan animate-breathe', sub: 'Running now' },
    amber: { title: 'Adjusting', tint: 'bg-warning/10', dot: 'bg-warning animate-breathe', sub: 'Running now' },
    red: { title: 'Disconnected', tint: 'bg-alert/10', dot: 'bg-alert', sub: 'Skill stopped and removed' },
    off: { title: 'Session finished', tint: 'bg-surface', dot: 'bg-muted', sub: 'Skill removed' },
  }[led];
  const name = model.expert ? `${model.expert} — ${model.title.replace(/ v\d.*$/, '')}` : model.title;
  return (
    <div className={`rounded-xl p-4 ${meta.tint}`} role="status">
      <p className={`flex items-center gap-2 text-[13px] font-medium ${LED[led].text}`}>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
        {meta.title}
      </p>
      <p className="mt-1.5 text-[17px] font-semibold leading-snug text-ink">{name}</p>
      <p className="mt-0.5 text-[13px] text-muted">{meta.sub}</p>
    </div>
  );
}

function AnomalyAlert({ phase, progress }) {
  if (phase === 'none') return null;
  if (phase === 'resolved') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-accent/10 p-4" role="status">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-[14px] text-ink">Signals are back to normal.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-warning/50 bg-warning/10 p-4" role="alert">
      <div className="flex gap-3">
        <Activity className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-warning">Unusual muscle signals — adjusting automatically</p>
          <p className="mt-1 text-[13px] text-ink/75">You may feel a slight twitch. No need to stop.</p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-warning transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Telemetry({ session, anomaly }) {
  const { remaining, total, status } = session;
  const live = status === 'active';
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const boost = anomaly.phase === 'stabilizing' ? (1 - anomaly.progress) * 9 : 0;
  const hz = useLiveReading(120, 1, live, boost);
  const ohm = useLiveReading(12.4, 0.55, live);

  const rows = [
    { label: 'Movement signal', reading: hz, unit: 'Hz', min: 108, max: 132, warn: boost > 1 },
    { label: 'Skin contact', reading: ohm, unit: 'Ω', min: 10.5, max: 14.5, warn: false },
  ];

  return (
    <section className="card p-5">
      <p className="text-[13px] text-muted">Time left</p>
      <p
        className={`mt-1 text-[56px] font-semibold leading-none tracking-tight tabular-nums ${live ? 'text-ink' : 'text-muted'}`}
        aria-label={`${Math.ceil(remaining / 60)} minutes left`}
      >
        {formatMMSS(remaining)}
      </p>
      <div
        className="mt-4 h-1 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Time left"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${live ? 'bg-accent' : 'bg-muted'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <dl className="mt-4 divide-y divide-line border-t border-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <dt className="text-[14px] text-ink">{r.label}</dt>
            <dd className="flex items-center gap-3">
              {live && <Sparkline series={r.reading.series} min={r.min} max={r.max} tone={r.warn ? 'text-warning' : 'text-accent'} />}
              <span className={`w-14 text-right text-[15px] font-semibold ${r.warn ? 'text-warning' : 'text-ink'}`}>
                {r.reading.value == null ? '—' : `${Math.round(r.reading.value)} ${r.unit}`}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ConfirmSheet({ onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-canvas/70" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full rounded-t-2xl border-t border-line bg-surface p-5 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        <h2 id="confirm-title" className="text-[18px] font-semibold text-ink">
          Stop skill &amp; disconnect?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          The skill stops right away. Any refund follows the rental terms.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button ref={cancelRef} onClick={onCancel} className="btn-secondary">
            Keep going
          </button>
          <button onClick={onConfirm} className="btn bg-alert text-white hover:bg-[#F87171]">
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActiveSessionFrame({ session, anomaly, onTerminate, onViewReport }) {
  const [confirming, setConfirming] = useState(false);
  const live = session.status === 'active';
  // Stable reference: the frame re-renders every timer tick, and the sheet's
  // focus/keydown effect must not re-run (and steal focus) on each one.
  const closeSheet = useCallback(() => setConfirming(false), []);

  const led =
    session.status === 'terminated' ? 'red' : !live ? 'off' : anomaly.phase === 'stabilizing' ? 'amber' : 'cyan';

  const confirmStop = () => {
    setConfirming(false);
    onTerminate();
  };

  return (
    <div className="space-y-4 p-5">
      <StatusBanner led={led} model={session.model} />
      <AnomalyAlert phase={anomaly.phase} progress={anomaly.progress} />
      <Telemetry session={session} anomaly={anomaly} />

      <section className="card p-5">
        <h2 className="text-[15px] font-medium text-ink">Your patch</h2>
        <p className="mt-0.5 text-[13px] text-muted">The light shows the patch's status. Hold the button to stop.</p>
        <div className="mt-5 flex justify-center">
          <Wearable led={led} onKill={onTerminate} disabled={!live} />
        </div>
        <ul className="mt-5 grid grid-cols-3 gap-2 text-[12px]">
          {['cyan', 'amber', 'red'].map((k) => (
            <li key={k} className={`flex items-center gap-1.5 ${led === k ? 'text-ink' : 'text-muted'}`}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LED[k].color, opacity: led === k ? 1 : 0.4 }} />
              {LED[k].label}
            </li>
          ))}
        </ul>
      </section>

      {live ? (
        <button onClick={() => setConfirming(true)} className="btn-danger h-12 w-full">
          Stop skill
        </button>
      ) : (
        <button onClick={onViewReport} className="btn-primary h-12 w-full">
          See session summary
        </button>
      )}

      {confirming && <ConfirmSheet onCancel={closeSheet} onConfirm={confirmStop} />}
    </div>
  );
}
