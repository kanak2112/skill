import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Wearable from '../components/Wearable.jsx';
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
  const w = 64;
  const h = 18;
  const pts = series.map((v, i) => [
    (i / (series.length - 1)) * w,
    h - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * h,
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} className={`h-[22px] w-[68px] ${tone}`} aria-hidden="true">
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" opacity="0.8" />
      <circle cx={lx} cy={ly} r="2" fill="currentColor" />
    </svg>
  );
}

const STATE = {
  active: { title: 'Skill active', icon: 'sensors', tone: 'text-teal' },
  warning: { title: 'Adjusting', icon: 'vital_signs', tone: 'text-amber' },
  disconnected: { title: 'Disconnected', icon: 'power_settings_new', tone: 'text-muted' },
  off: { title: 'Session finished', icon: 'check_circle', tone: 'text-muted' },
};

function StatusBanner({ led, model }) {
  const state = STATE[led];
  const source = model.expert ?? (model.trainedOn ? `Synthesized from ${model.trainedOn}` : 'Synthetic model');
  return (
    <div role="status">
      <p className={`eyebrow flex items-center gap-1.5 ${state.tone}`}>
        <Icon name={state.icon} size={16} />
        {state.title}
      </p>
      <p className="mt-2 text-[18px] font-medium leading-snug tracking-[-0.01em] text-ink">{model.title.replace(/ v\d.*$/, '')}</p>
      <p className="mt-0.5 text-caption text-muted">{source}</p>
    </div>
  );
}

function AnomalyAlert({ phase, progress }) {
  if (phase === 'none') return null;
  if (phase === 'resolved') {
    return (
      <div className="flex items-center gap-2.5 border-y border-line py-3" role="status">
        <Icon name="check_circle" size={18} className="text-teal" />
        <p className="text-[13px] text-ink">Signals are back to normal.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber/40 bg-amber/[0.06] p-4" role="alert">
      <div className="flex gap-2.5">
        <Icon name="vital_signs" size={18} className="text-amber" />
        <div className="min-w-0 flex-1">
          <p className="text-title text-ink">Unusual muscle signals. Adjusting automatically.</p>
          <p className="mt-0.5 text-caption text-muted">You may feel a slight twitch. No need to stop.</p>
          <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-amber transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
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
    <section className="border-t border-line pt-5">
      <p className="eyebrow">Time left</p>
      <p
        className={`metric mt-2 text-[56px] font-light ${live ? 'text-ink' : 'text-muted'}`}
        aria-label={`${Math.ceil(remaining / 60)} minutes left`}
      >
        {formatMMSS(remaining)}
      </p>
      <div
        className="mt-4 h-0.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Time left"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${live ? 'bg-teal' : 'bg-muted'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <dl className="mt-4 divide-y divide-line border-t border-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <dt className="text-[14px] text-ink">{r.label}</dt>
            <dd className="flex items-center gap-3">
              {live && <Sparkline series={r.reading.series} min={r.min} max={r.max} tone={r.warn ? 'text-amber' : 'text-muted'} />}
              <span className={`metric w-16 text-right text-[18px] ${r.warn ? 'text-amber' : 'text-ink'}`}>
                {r.reading.value == null ? 'Off' : `${Math.round(r.reading.value)} ${r.unit}`}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ActiveSessionFrame({ session, anomaly, onTerminate, onViewReport }) {
  const live = session.status === 'active';
  const led =
    session.status === 'terminated' ? 'disconnected' : !live ? 'off' : anomaly.phase === 'stabilizing' ? 'warning' : 'active';

  return (
    <div className="space-y-5 p-5">
      <StatusBanner led={led} model={session.model} />
      <AnomalyAlert phase={anomaly.phase} progress={anomaly.progress} />
      <Telemetry session={session} anomaly={anomaly} />

      <section className="border-t border-line pt-5">
        <p className="eyebrow">Your patch</p>
        <div className="mt-4 flex justify-center">
          <Wearable led={led} onKill={onTerminate} disabled={!live} />
        </div>
        <p className={`mt-4 flex items-center justify-center gap-1.5 text-caption ${STATE[led].tone}`}>
          <Icon name={STATE[led].icon} size={16} />
          {led === 'active' ? 'Ring on: skill running' : led === 'warning' ? 'Ring pulsing: adjusting signals' : 'Ring off: skill removed'}
        </p>
      </section>

      {!live && (
        <button onClick={onViewReport} className="btn-secondary h-12 w-full">
          See session summary
          <Icon name="chevron_right" size={18} />
        </button>
      )}
    </div>
  );
}
