import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, ChevronRight, Cpu, FileBarChart, OctagonX, Waves, Zap } from 'lucide-react';
import { formatMMSS } from '../hooks/useSessionTimer.js';
import { AlertBox, CornerMarks, SectionLabel, StatusDot } from '../components/ui.jsx';

const PATCH_ID = '#T3-99';

const STATUS_META = {
  active: { label: 'Stream Active', tone: 'red', text: 'text-syn-red', pulse: true },
  terminated: { label: 'Stream Terminated', tone: 'red', text: 'text-syn-red', pulse: false },
  complete: { label: 'Stream Complete', tone: 'cyan', text: 'text-syn-cyan', pulse: false },
};

const TELEMETRY = [
  {
    key: 'load',
    icon: Activity,
    label: 'Synaptic Load',
    value: '78',
    unit: '%',
    meter: 0.78,
    status: 'Elevated',
    valueClass: 'text-syn-amber',
    statusClass: 'text-syn-amber border-syn-amber/40 bg-syn-amber/10',
    barClass: 'bg-syn-amber',
  },
  {
    key: 'motor',
    icon: Zap,
    label: 'Motor Cortex Output',
    value: '120',
    unit: 'Hz',
    meter: 0.6,
    status: 'Optimal',
    valueClass: 'text-syn-ink',
    statusClass: 'text-syn-ok border-syn-ok/40 bg-syn-ok/10',
    barClass: 'bg-syn-ok',
  },
  {
    key: 'impedance',
    icon: Waves,
    label: 'Haptic Impedance',
    value: '12',
    unit: 'Ω',
    meter: 0.24,
    status: 'Calibrated',
    valueClass: 'text-syn-ink',
    statusClass: 'text-syn-cyan border-syn-cyan/40 bg-syn-cyan/10',
    barClass: 'bg-syn-cyan',
  },
];

/** Deterministic pseudo-random sample so the trace animates with the timer tick. */
function sample(seed, i) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function SyncTrace({ seed, live }) {
  const bars = 40;
  return (
    <div className="flex h-7 items-end gap-[2px]" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => {
        const h = live ? 0.2 + sample(seed, i) * 0.8 : 0.06;
        return (
          <span
            key={i}
            className={`flex-1 transition-[height] duration-500 ${live ? (i > bars - 4 ? 'bg-syn-cyan' : 'bg-syn-cyan/40') : 'bg-syn-hairline'}`}
            style={{ height: `${h * 100}%` }}
          />
        );
      })}
    </div>
  );
}

function TimerModule({ session }) {
  const { remaining, total, status, profile } = session;
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const minsLeft = Math.ceil(remaining / 60);
  const live = status === 'active';
  const timerColor = status === 'terminated' ? 'text-syn-red' : 'text-syn-ink';

  return (
    <section className="relative rounded-sm border border-syn-frame bg-syn-surface">
      <CornerMarks tone={live ? 'border-syn-cyan' : 'border-syn-frame'} />
      <div className="border-b border-syn-hairline px-3 py-2.5">
        <p className="t-label">Active Neural Profile</p>
        <p className="mt-1.5 font-sans text-[14px] font-semibold leading-snug text-syn-ink">{profile}</p>
      </div>

      <div className="px-3 pb-3 pt-4">
        <div className="flex items-end justify-between">
          <p
            className={`t-data text-[64px] font-bold leading-[0.85] tracking-tight ${timerColor}`}
            aria-live="off"
            aria-label={`${minsLeft} minutes remaining`}
          >
            {formatMMSS(remaining)}
          </p>
          <div className="pb-1 text-right">
            <p className="t-label">MM:SS</p>
            <p className={`t-data mt-1.5 text-[10px] font-semibold tracking-instrument ${live ? 'text-syn-cyan' : 'text-syn-muted'}`}>
              {live ? 'T-MINUS' : status === 'complete' ? 'ELAPSED' : 'HALTED'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <SyncTrace seed={remaining} live={live} />
        </div>

        <div
          className="relative mt-2 h-2 overflow-hidden rounded-sm border border-syn-hairline bg-syn-canvas"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Session time remaining"
        >
          <div
            className={`h-full transition-[width] duration-1000 ease-linear ${status === 'terminated' ? 'bg-syn-red' : 'bg-syn-cyan'}`}
            style={{ width: `${pct}%` }}
          />
          {/* 10% graduation ticks */}
          <div className="pointer-events-none absolute inset-0 flex">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="flex-1 border-r border-syn-canvas/70 last:border-r-0" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-syn-hairline px-3 py-2">
        <span className="t-label">Session Runtime</span>
        <span className={`t-data text-[10px] font-bold uppercase tracking-instrument ${live ? 'text-syn-cyan' : 'text-syn-muted'}`}>
          {status === 'active' && `${minsLeft} MIN REMAINING`}
          {status === 'terminated' && `HALTED @ ${minsLeft} MIN`}
          {status === 'complete' && 'RUNTIME EXHAUSTED'}
        </span>
      </div>
    </section>
  );
}

function TelemetryBlock({ live }) {
  return (
    <section className="space-y-2">
      <SectionLabel index="T" right={live ? 'LIVE · 1 Hz' : 'OFFLINE'}>
        Real-Time Telemetry
      </SectionLabel>
      <div className="divide-y divide-syn-hairline rounded-sm border border-syn-hairline bg-syn-surface">
        {TELEMETRY.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 px-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-syn-muted" strokeWidth={2} />
                  <span className="truncate font-mono text-[11px] uppercase tracking-wide text-syn-ink/90">{t.label}</span>
                </div>
                <div className="mt-2 h-[3px] w-full bg-syn-canvas">
                  <div
                    className={`h-full transition-[width] duration-700 ${live ? t.barClass : 'bg-syn-hairline'}`}
                    style={{ width: `${(live ? t.meter : 0.02) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`t-data text-[20px] font-bold leading-none ${live ? t.valueClass : 'text-syn-muted'}`}>
                  {live ? t.value : '--'}
                  <span className="ml-0.5 text-[11px] font-semibold text-syn-muted">{t.unit}</span>
                </span>
                <span
                  className={`tag ${live ? t.statusClass : 'border-syn-hairline bg-syn-canvas text-syn-muted'}`}
                >
                  {live ? t.status : 'Disengaged'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DecoherenceModal({ onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-syn-canvas/85 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decoherence-title"
      onClick={onCancel}
    >
      <div className="relative w-full rounded-sm border border-syn-red bg-syn-surface" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 bg-hatch-red" />
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-syn-red" strokeWidth={2.25} />
            <span className="t-label text-syn-red">Kill-Switch Armed · {PATCH_ID}</span>
          </div>
          <h2 id="decoherence-title" className="font-sans text-[18px] font-bold leading-tight tracking-wide text-syn-ink">
            CONFIRM IMMEDIATE DECOHERENCE?
          </h2>
          <p className="font-mono text-[11px] leading-relaxed text-syn-ink/70">
            Abrupt link severance will purge the active motor overlay. Unbilled runtime is forfeited. Expect transient
            proprioceptive dropout (≤&nbsp;90&nbsp;s).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-syn-hairline bg-syn-hairline">
          <button ref={cancelRef} onClick={onCancel} className="btn h-12 rounded-none border-0 bg-syn-surface text-syn-ink hover:bg-syn-hairline">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn h-12 rounded-none border-0 bg-syn-red text-syn-canvas hover:bg-[#f87171]">
            <OctagonX className="h-4 w-4" strokeWidth={2.5} />
            Stop Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActiveSessionFrame({ session, onTerminate, onViewReport, onBrowse }) {
  const [confirming, setConfirming] = useState(false);
  const meta = STATUS_META[session.status];
  const live = session.status === 'active';
  // Stable reference: the frame re-renders every timer tick, and the modal's
  // focus/keydown effect must not re-run (and steal focus) on each one.
  const closeModal = useCallback(() => setConfirming(false), []);

  const confirmStop = () => {
    setConfirming(false);
    onTerminate();
  };

  return (
    <div className="space-y-4 p-4">
      {/* Active link header */}
      <div className="flex items-center justify-between rounded-sm border border-syn-hairline bg-syn-surface px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <StatusDot tone={meta.tone} pulse={meta.pulse} fast />
          <span className={`font-mono text-[12px] font-bold uppercase tracking-brand ${meta.text}`}>{meta.label}</span>
        </div>
        <span className="t-data text-[10px] font-semibold tracking-instrument text-syn-muted">
          PATCH ID: <span className="text-syn-ink">{PATCH_ID}</span>
        </span>
      </div>

      <TimerModule session={session} />
      <TelemetryBlock live={live} />

      <AlertBox tone="amber" title="Residual Drift Detected">
        Micro-anxiety artifacts from source expert entering motor pathways. Mild resting hand tremor expected
        post-session (Decay: ~14h).
      </AlertBox>

      {/* Emergency decoherence control / terminal state */}
      {live ? (
        <div className="space-y-2">
          <button onClick={() => setConfirming(true)} className="btn-red h-12 w-full border-[1.5px] text-[12px]">
            <OctagonX className="h-4 w-4" strokeWidth={2.25} />
            Emergency Decoherence / Stop
          </button>
          <p className="t-data text-center text-[9px] uppercase tracking-wide text-syn-muted">
            <Cpu className="mr-1 inline h-3 w-3 -translate-y-px" strokeWidth={2} />
            Hardware interlock · Response latency &lt; 4 ms
          </p>
        </div>
      ) : (
        <div
          className={`rounded-sm border ${session.status === 'terminated' ? 'border-syn-red/60 bg-syn-red/[0.06]' : 'border-syn-cyan/50 bg-syn-cyan/[0.06]'}`}
        >
          <div className="px-3 py-3">
            <p className={`font-mono text-[11px] font-bold uppercase tracking-instrument ${meta.text}`}>
              {session.status === 'terminated' ? 'Decoherence Complete — Link Severed' : 'Runtime Exhausted — Link Released'}
            </p>
            <p className="mt-1.5 font-mono text-[10px] uppercase leading-relaxed tracking-wide text-syn-muted">
              Overlay purged from patch {PATCH_ID}. Post-session diagnostic compiled.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-syn-hairline bg-syn-hairline">
            <button onClick={onBrowse} className="btn h-11 rounded-none border-0 bg-syn-surface text-syn-ink hover:bg-syn-hairline">
              Storefront
            </button>
            <button onClick={onViewReport} className="btn h-11 rounded-none border-0 bg-syn-cyan text-syn-canvas hover:bg-[#22d3ee]">
              <FileBarChart className="h-4 w-4" strokeWidth={2.25} />
              Report
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {confirming && <DecoherenceModal onCancel={closeModal} onConfirm={confirmStop} />}
    </div>
  );
}
