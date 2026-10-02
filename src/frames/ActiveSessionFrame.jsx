import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatMMSS } from '../hooks/useSessionTimer.js';

const STATUS_META = {
  active: { label: 'Stream Active', dot: 'bg-alert animate-breathe' },
  terminated: { label: 'Disconnected', dot: 'bg-muted' },
  complete: { label: 'Session Complete', dot: 'bg-accent' },
};

const TELEMETRY = [
  { key: 'load', label: 'Synaptic Load', value: '78%', numeric: true, status: 'Elevated', tone: 'text-warning' },
  { key: 'motor', label: 'Motor Output', value: '120 Hz', status: 'Optimal', tone: 'text-muted' },
  { key: 'impedance', label: 'Skin Impedance', value: '12 Ω', status: 'Calibrated', tone: 'text-muted' },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[13px] font-medium text-ink">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function Countdown({ session }) {
  const { remaining, total, status, profile } = session;
  const pct = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <section className="card p-5">
      <p className="text-[13px] text-muted">Active skill</p>
      <p className="mt-1 text-[16px] font-medium text-ink">{profile}</p>

      <p
        className={`mt-6 text-[64px] font-semibold leading-none tracking-tight tabular-nums ${
          status === 'active' ? 'text-ink' : 'text-muted'
        }`}
        aria-label={`${Math.ceil(remaining / 60)} minutes remaining`}
      >
        {formatMMSS(remaining)}
      </p>
      <p className="mt-2 text-[13px] text-muted">{status === 'active' ? 'Remaining' : 'Stopped'}</p>

      <div
        className="mt-5 h-1 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Session time remaining"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
            status === 'active' ? 'bg-accent' : 'bg-muted'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}

function Telemetry({ live }) {
  return (
    <section>
      <h2 className="mb-2 text-[14px] font-medium text-muted">Vitals</h2>
      <ul className="card divide-y divide-line px-5">
        {TELEMETRY.map((t) => (
          <li key={t.key} className="flex items-center justify-between py-4">
            <span className="text-[15px] text-ink">{t.label}</span>
            <span className="text-right">
              <span className={`text-[15px] font-semibold text-ink ${t.numeric ? 'tabular-nums' : ''}`}>
                {live ? t.value : '—'}
              </span>
              <span className={`ml-2 text-[13px] ${live ? t.tone : 'text-muted'}`}>{live ? t.status : 'Offline'}</span>
            </span>
          </li>
        ))}
      </ul>
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
          The skill stream will stop immediately. Remaining time is not refunded.
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

export default function ActiveSessionFrame({ session, onTerminate, onViewReport }) {
  const [confirming, setConfirming] = useState(false);
  const live = session.status === 'active';
  // Stable reference: the frame re-renders every timer tick, and the sheet's
  // focus/keydown effect must not re-run (and steal focus) on each one.
  const closeSheet = useCallback(() => setConfirming(false), []);

  const confirmStop = () => {
    setConfirming(false);
    onTerminate();
  };

  return (
    <div className="space-y-5 p-5">
      <StatusBadge status={session.status} />
      <Countdown session={session} />
      <Telemetry live={live} />

      <div role="note" className="flex gap-3 rounded-xl bg-warning/10 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={2} />
        <div>
          <p className="text-[14px] font-semibold text-warning">Residual Drift Notice</p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink/80">
            Mild resting hand tremor expected post-session (Decay duration: ~14h).
          </p>
        </div>
      </div>

      {live ? (
        <button onClick={() => setConfirming(true)} className="btn-danger h-12 w-full">
          Stop Session
        </button>
      ) : (
        <button onClick={onViewReport} className="btn-primary h-12 w-full">
          View Diagnostic
        </button>
      )}

      {confirming && <ConfirmSheet onCancel={closeSheet} onConfirm={confirmStop} />}
    </div>
  );
}
