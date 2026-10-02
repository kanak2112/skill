import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';
import Wearable, { LED } from '../components/Wearable.jsx';
import { formatMMSS } from '../hooks/useSessionTimer.js';

function useLiveReading(base, spread, active, boost = 0) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setValue(base + (Math.random() - 0.5) * 2 * (spread + boost)), 700);
    return () => clearInterval(id);
  }, [base, spread, active, boost]);
  return active ? value : null;
}

function StatusBanner({ led, profile }) {
  const meta = {
    cyan: { title: 'Streaming', tint: 'bg-cyan/10', dot: 'bg-cyan animate-breathe' },
    amber: { title: 'Drift warning', tint: 'bg-warning/10', dot: 'bg-warning animate-breathe' },
    red: { title: 'Decoherence — stream terminated', tint: 'bg-alert/10', dot: 'bg-alert' },
    off: { title: 'Session complete', tint: 'bg-surface', dot: 'bg-muted' },
  }[led];
  return (
    <div className={`rounded-xl p-4 ${meta.tint}`} role="status">
      <p className={`flex items-center gap-2 text-[13px] font-medium ${LED[led].text}`}>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
        {meta.title}
      </p>
      <p className="mt-1.5 text-[17px] font-semibold leading-snug text-ink">{profile}</p>
      <p className="mt-0.5 text-[13px] text-muted">{led === 'red' || led === 'off' ? 'Motor profile released' : 'Active motor profile'}</p>
    </div>
  );
}

function AnomalyAlert({ phase, progress }) {
  if (phase === 'none') return null;
  if (phase === 'resolved') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-accent/10 p-4" role="status">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-[14px] text-ink">Motor variance stabilized. Stream continuing normally.</p>
      </div>
    );
  }
  const variance = Math.round(18 - progress * 14);
  return (
    <div className="rounded-xl bg-warning/10 p-4" role="alert">
      <div className="flex gap-3">
        <Activity className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-warning">Unusual motor cortex variance detected — Auto-stabilizing</p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-warning transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-muted">
            Variance <span className="tabular-nums text-ink">{variance}%</span> · target{' '}
            <span className="tabular-nums">&lt; 5%</span>
          </p>
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
  const ohm = useLiveReading(12, 0.4, live);

  return (
    <section className="card p-5">
      <p className="text-[13px] text-muted">Remaining</p>
      <p
        className={`mt-1 text-[56px] font-semibold leading-none tracking-tight tabular-nums ${live ? 'text-ink' : 'text-muted'}`}
        aria-label={`${Math.ceil(remaining / 60)} minutes remaining`}
      >
        {formatMMSS(remaining)}
      </p>
      <div
        className="mt-4 h-1 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Session time remaining"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${live ? 'bg-accent' : 'bg-muted'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <dl className="mt-4 divide-y divide-line border-t border-line">
        <div className="flex items-baseline justify-between py-3">
          <dt className="text-[14px] text-ink">Motor frequency</dt>
          <dd className={`text-[15px] font-semibold ${boost > 1 ? 'text-warning' : 'text-ink'}`}>
            {hz == null ? '—' : `${Math.round(hz)} Hz`}
          </dd>
        </div>
        <div className="flex items-baseline justify-between pt-3">
          <dt className="text-[14px] text-ink">Skin contact impedance</dt>
          <dd className="text-[15px] font-semibold text-ink">{ohm == null ? '—' : `${Math.round(ohm)} Ω`}</dd>
        </div>
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
          Confirm Disconnect?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          The skill stream will stop immediately. Remaining time is refunded per the rental terms.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button ref={cancelRef} onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn bg-alert text-white hover:bg-[#F87171]">
            Disconnect Now
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
      <StatusBanner led={led} profile={session.model.profile} />
      <AnomalyAlert phase={anomaly.phase} progress={anomaly.progress} />
      <Telemetry session={session} anomaly={anomaly} />

      <section className="card p-5">
        <h2 className="text-[14px] font-medium text-ink">Neural patch</h2>
        <p className="mt-0.5 text-[13px] text-muted">Physical status ring and touch kill-switch</p>
        <div className="mt-4 flex justify-center">
          <Wearable led={led} onKill={onTerminate} disabled={!live} />
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
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
          Stop Session
        </button>
      ) : (
        <button onClick={onViewReport} className="btn-primary h-12 w-full">
          View Diagnostic Report
        </button>
      )}

      {confirming && <ConfirmSheet onCancel={closeSheet} onConfirm={confirmStop} />}
    </div>
  );
}
