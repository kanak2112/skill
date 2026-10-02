import { useEffect, useRef, useState } from 'react';
import { Power } from 'lucide-react';

const HOLD_MS = 3000; // 3-2-1 countdown
const RELEASE_MS = 1100; // ring drains segment by segment once triggered
const R = 84;
const C = 2 * Math.PI * R;
const SEGMENTS = 24;

export const LED = {
  cyan: { color: '#22D3EE', label: 'Active', text: 'text-cyan' },
  amber: { color: '#F59E0B', label: 'Warning', text: 'text-warning' },
  red: { color: '#EF4444', label: 'Disconnected', text: 'text-alert' },
  off: { color: '#334155', label: 'Idle', text: 'text-muted' },
};

/**
 * The patch: a segmented LED ring around a touch kill-switch.
 * Hold for 3 s (3-2-1) to disconnect. Letting go early cancels.
 * Once the countdown completes the ring turns red segment by segment
 * before the skill is released, so the stop reads as deliberate.
 */
export default function Wearable({ led, onKill, disabled }) {
  const [hold, setHold] = useState(0); // 0..1 while holding
  const [releasing, setReleasing] = useState(0); // 0..1 after trigger
  const raf = useRef(0);
  const started = useRef(0);

  const cancel = () => {
    if (releasing) return;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    setHold(0);
  };

  const release = () => {
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / RELEASE_MS);
      setReleasing(p);
      if (p >= 1) {
        raf.current = 0;
        setHold(0);
        setReleasing(0);
        onKill();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (disabled || raf.current) return;
    started.current = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - started.current) / HOLD_MS);
      setHold(p);
      if (p >= 1) {
        release();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const holding = hold > 0 && !releasing;
  const count = Math.max(1, 3 - Math.floor(hold * 3));
  const redSegments = Math.ceil(releasing * SEGMENTS);
  const pulse = led === 'amber' ? 'animate-[breathe_0.9s_ease-in-out_infinite]' : led === 'cyan' && !hold ? 'animate-breathe' : '';
  const seg = C / SEGMENTS;

  return (
    <div className="relative h-[200px] w-[200px]">
      <svg viewBox="0 0 220 220" className="h-full w-full" role="img" aria-label={`Patch light: ${LED[led].label}`}>
        <circle cx="110" cy="110" r="104" fill="#1E293B" stroke="#334155" />
        <circle cx="110" cy="110" r="96" fill="none" stroke="#0F172A" strokeWidth="1" />
        {/* Status ring: 24 LED segments */}
        <circle
          cx="110"
          cy="110"
          r={R}
          fill="none"
          stroke={LED[led].color}
          strokeWidth="6"
          strokeDasharray={`${seg - 6} 6`}
          opacity={hold ? 0.25 : 1}
          className={pulse}
          style={{ transition: 'stroke 300ms, opacity 200ms' }}
        />
        {/* Hold progress: fills clockwise in red */}
        {hold > 0 && (
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke="#EF4444"
            strokeWidth="8"
            strokeDasharray={`${hold * C} ${C}`}
            transform="rotate(-90 110 110)"
          />
        )}
        {/* Thirds markers for the 3-2-1 count */}
        {hold > 0 &&
          [0, 1, 2].map((i) => {
            const a = (i / 3) * 2 * Math.PI - Math.PI / 2;
            return (
              <line
                key={i}
                x1={110 + Math.cos(a) * 76}
                y1={110 + Math.sin(a) * 76}
                x2={110 + Math.cos(a) * 92}
                y2={110 + Math.sin(a) * 92}
                stroke="#0F172A"
                strokeWidth="3"
              />
            );
          })}
        {/* After trigger: segments go dark one by one */}
        {releasing > 0 && (
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke="#0F172A"
            strokeWidth="9"
            strokeDasharray={`${(redSegments / SEGMENTS) * C} ${C}`}
            transform="rotate(-90 110 110)"
            opacity="0.7"
          />
        )}
      </svg>

      <button
        type="button"
        disabled={disabled || releasing > 0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          begin();
        }}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            begin();
          }
        }}
        onKeyUp={cancel}
        onContextMenu={(e) => e.preventDefault()}
        className={`absolute left-1/2 top-1/2 flex h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 touch-none select-none flex-col items-center justify-center gap-0.5 rounded-full border transition-colors disabled:cursor-not-allowed ${
          hold > 0 ? 'border-alert/60 bg-alert/10 text-alert' : 'border-line bg-canvas text-muted enabled:hover:text-ink'
        } ${disabled ? 'opacity-50' : ''}`}
        aria-label="Stop button: press and hold for 3 seconds to disconnect"
      >
        {releasing > 0 ? (
          <span className="text-[13px] font-medium">Disconnecting…</span>
        ) : holding ? (
          <>
            <span className="text-[40px] font-semibold leading-none tabular-nums" aria-live="assertive">
              {count}
            </span>
            <span className="text-[11px]">Keep holding</span>
          </>
        ) : (
          <>
            <Power className="h-6 w-6" strokeWidth={1.75} />
            <span className="text-[11px] leading-tight">{disabled ? 'Stopped' : 'Hold 3s to stop'}</span>
          </>
        )}
      </button>
    </div>
  );
}
