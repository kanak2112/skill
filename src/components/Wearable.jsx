import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const HOLD_MS = 3000; // 3-2-1 countdown
const RELEASE_MS = 1100; // ring drains once triggered
const R = 92;
const C = 2 * Math.PI * R;

const TEAL = [91, 191, 186];
const CORAL = [224, 109, 83];
const mix = (t) => `rgb(${TEAL.map((b, i) => Math.round(b + (CORAL[i] - b) * t)).join(',')})`;

export const LED = {
  active: { color: '#5BBFBA', label: 'Active', text: 'text-teal' },
  warning: { color: '#F2A65A', label: 'Warning', text: 'text-amber' },
  disconnected: { color: '#94A3B8', label: 'Disconnected', text: 'text-muted' },
  off: { color: '#222A38', label: 'Idle', text: 'text-muted' },
};

/**
 * The patch: a thin status ring around a touch stop control, the only way to
 * end a session from this screen. Hold for 3 s (3-2-1); the ring fills and
 * shifts from teal (connected) to coral (disconnect). Letting go early cancels. Once complete the ring
 * drains before the skill is released, so the stop reads as deliberate.
 */
export default function Wearable({ led, onKill, disabled }) {
  const [hold, setHold] = useState(0);
  const [releasing, setReleasing] = useState(0);
  const raf = useRef(0);
  const started = useRef(0);
  const releasingRef = useRef(false);

  const cancel = () => {
    if (releasingRef.current) return;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    setHold(0);
  };

  const release = () => {
    releasingRef.current = true;
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / RELEASE_MS);
      setReleasing(p);
      if (p >= 1) {
        raf.current = 0;
        releasingRef.current = false;
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
  const ringColor = hold > 0 ? mix(hold) : LED[led].color;
  const pulse = led === 'warning' ? 'animate-[breathe_1s_ease-in-out_infinite]' : led === 'active' && !hold ? 'animate-breathe' : '';

  return (
    <div className="relative h-[224px] w-[224px]">
      <svg viewBox="0 0 220 220" className="h-full w-full" role="img" aria-label={`Patch light: ${LED[led].label}`}>
        {/* Track */}
        <circle cx="110" cy="110" r={R} fill="none" stroke="#222A38" strokeWidth="2" />
        {/* Status ring */}
        {!hold && <circle cx="110" cy="110" r={R} fill="none" stroke={ringColor} strokeWidth="2" className={pulse} style={{ transition: 'stroke 400ms' }} />}
        {/* Hold progress */}
        {hold > 0 && (
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${(1 - releasing) * hold * C} ${C}`}
            strokeDashoffset={-releasing * C}
            transform="rotate(-90 110 110)"
          />
        )}
        {/* Thirds markers for the 3-2-1 count */}
        {holding &&
          [0, 1, 2].map((i) => {
            const a = (i / 3) * 2 * Math.PI - Math.PI / 2;
            return (
              <circle key={i} cx={110 + Math.cos(a) * R} cy={110 + Math.sin(a) * R} r="2.5" fill={hold * 3 > i ? ringColor : '#222A38'} />
            );
          })}
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
        className="absolute left-1/2 top-1/2 flex h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 touch-none select-none flex-col items-center justify-center gap-1 rounded-full border border-line bg-canvas text-muted transition-colors enabled:hover:text-ink disabled:cursor-not-allowed"
        aria-label="Stop: press and hold for 3 seconds to disconnect"
      >
        {releasing > 0 ? (
          <span className="text-[13px] text-alert">Disconnecting…</span>
        ) : holding ? (
          <>
            <span className="metric text-[44px] font-light" style={{ color: ringColor }} aria-live="assertive">
              {count}
            </span>
            <span className="text-caption">Keep holding</span>
          </>
        ) : disabled ? (
          <>
            <Icon name="power_settings_new" size={26} />
            <span className="text-caption">Disconnected</span>
          </>
        ) : (
          <>
            <Icon name="power_settings_new" size={26} className="text-ink" />
            <span className="text-[13px] text-ink">Hold to stop</span>
            <span className="text-caption">3 seconds</span>
          </>
        )}
      </button>
    </div>
  );
}
