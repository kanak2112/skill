import { useEffect, useRef, useState } from 'react';
import { Power } from 'lucide-react';

const HOLD_MS = 1500;
const R = 84;
const C = 2 * Math.PI * R;

export const LED = {
  cyan: { color: '#22D3EE', label: 'Active', text: 'text-cyan' },
  amber: { color: '#F59E0B', label: 'Drift warning', text: 'text-warning' },
  red: { color: '#EF4444', label: 'Decoherence', text: 'text-alert' },
  off: { color: '#334155', label: 'Idle', text: 'text-muted' },
};

/**
 * Neural patch hardware: segmented LED status ring around a touch-capacitive
 * kill-switch. Press and hold for 1.5 s to trigger decoherence.
 */
export default function Wearable({ led, onKill, disabled }) {
  const [hold, setHold] = useState(0);
  const raf = useRef(0);
  const started = useRef(0);

  const stop = () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    setHold(0);
  };

  const begin = () => {
    if (disabled || raf.current) return;
    started.current = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - started.current) / HOLD_MS);
      setHold(p);
      if (p >= 1) {
        raf.current = 0;
        setHold(0);
        onKill();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const { color } = LED[led];
  const pulse = led === 'amber' ? 'animate-[breathe_0.9s_ease-in-out_infinite]' : led === 'cyan' ? 'animate-breathe' : '';

  return (
    <div className="relative h-[200px] w-[200px]">
      <svg viewBox="0 0 220 220" className="h-full w-full" role="img" aria-label={`Patch LED: ${LED[led].label}`}>
        <circle cx="110" cy="110" r="104" fill="#1E293B" stroke="#334155" />
        <circle cx="110" cy="110" r="96" fill="none" stroke="#0F172A" strokeWidth="1" />
        {/* LED ring: 24 segments */}
        <circle
          cx="110"
          cy="110"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${C / 24 - 6} 6`}
          className={pulse}
          style={{ transition: 'stroke 300ms' }}
        />
        {/* Hold-to-kill progress */}
        {hold > 0 && (
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke="#F8FAFC"
            strokeWidth="6"
            strokeDasharray={`${hold * C} ${C}`}
            transform="rotate(-90 110 110)"
          />
        )}
      </svg>

      {/* Touch pad sits over the SVG centre */}
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          begin();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            begin();
          }
        }}
        onKeyUp={stop}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute left-1/2 top-1/2 flex h-[116px] -translate-x-1/2 -translate-y-1/2 w-[116px] touch-none select-none flex-col items-center justify-center gap-1 rounded-full border border-line bg-canvas text-muted transition-colors enabled:hover:text-ink enabled:active:bg-surface disabled:opacity-50"
        aria-label="Kill-switch: press and hold to stop the stream"
      >
        <Power className="h-6 w-6" strokeWidth={1.75} />
        <span className="text-[11px] leading-tight">{hold > 0 ? 'Keep holding' : disabled ? 'Stopped' : 'Hold to stop'}</span>
      </button>
    </div>
  );
}
