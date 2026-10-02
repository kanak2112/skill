import { useCallback, useEffect, useReducer, useRef } from 'react';
import Icon from './Icon.jsx';
import { motion } from '../theme/tokens.js';
import { haptic, isSettled, reducedMotion, stepSpring } from '../motion/spring.js';

const HOLD_MS = motion.hold.durationMs; // 3-2-1 countdown
const RELEASE_MS = motion.hold.releaseMs; // ring drains once triggered
const R = 92;
const C = 2 * Math.PI * R;

const TEAL = [91, 191, 186];
const CORAL = [224, 109, 83];
const mix = (t) => `rgb(${TEAL.map((b, i) => Math.round(b + (CORAL[i] - b) * t)).join(',')})`;

export const LED = {
  active: { color: '#5BBFBA', label: 'Active', text: 'text-teal' },
  warning: { color: '#F2A65A', label: 'Warning', text: 'text-amber' },
  disconnected: { color: '#8E9BAE', label: 'Disconnected', text: 'text-muted' },
  off: { color: '#222A38', label: 'Idle', text: 'text-muted' },
};

/**
 * The patch: a thin status ring around a touch stop control, the only way to
 * end a session from this screen.
 *  - Hold for 3 s (3-2-1). Elapsed time drives the countdown; the ring's fill
 *    follows it through a spring (stiffness 300, damping 25) for a smooth,
 *    ease-out radial fill, shifting from teal (connected) to coral (disconnect).
 *  - Letting go early springs the ring back to empty.
 *  - On completion the ring drains before the skill is released.
 *  - Haptics: a tap on press, a tick on each count, a longer pattern on stop.
 */
export default function Wearable({ led, onKill, disabled }) {
  const m = useRef({ holding: false, releasing: false, t0: 0, r0: 0, progress: 0, rel: 0, count: 3, fill: { x: 0, v: 0 }, raf: 0, last: 0 });
  const [, render] = useReducer((n) => n + 1, 0);
  const onKillRef = useRef(onKill);
  onKillRef.current = onKill;

  const loop = useCallback((now) => {
    const s = m.current;
    const dt = s.last ? (now - s.last) / 1000 : 1 / 60;
    s.last = now;

    if (s.holding) {
      s.progress = Math.min(1, (now - s.t0) / HOLD_MS);
      const count = Math.max(1, 3 - Math.floor(s.progress * 3));
      if (count !== s.count) {
        s.count = count;
        haptic(motion.haptics.tick);
      }
      if (s.progress >= 1) {
        s.holding = false;
        s.releasing = true;
        s.r0 = now;
        haptic(motion.haptics.complete);
      }
    }

    const target = s.holding || s.releasing ? s.progress : 0;
    if (reducedMotion()) s.fill = { x: target, v: 0 };
    else stepSpring(s.fill, target, dt);

    if (s.releasing) {
      s.rel = Math.min(1, (now - s.r0) / RELEASE_MS);
      if (s.rel >= 1) {
        Object.assign(s, { releasing: false, progress: 0, rel: 0, count: 3, fill: { x: 0, v: 0 } });
        render();
        s.raf = 0;
        s.last = 0;
        onKillRef.current();
        return;
      }
    }

    render();
    if (s.holding || s.releasing || !isSettled(s.fill, 0, 0.002)) s.raf = requestAnimationFrame(loop);
    else {
      s.raf = 0;
      s.last = 0;
    }
  }, []);

  const kick = () => {
    if (!m.current.raf) m.current.raf = requestAnimationFrame(loop);
  };

  const begin = () => {
    const s = m.current;
    if (disabled || s.holding || s.releasing) return;
    Object.assign(s, { holding: true, t0: performance.now(), progress: 0, count: 3 });
    haptic(motion.haptics.start);
    kick();
  };

  const cancel = () => {
    const s = m.current;
    if (s.releasing || !s.holding) return;
    s.holding = false;
    s.progress = 0;
    haptic(motion.haptics.cancel);
    kick(); // spring the ring back to empty
  };

  useEffect(() => () => cancelAnimationFrame(m.current.raf), []);

  const s = m.current;
  const hold = Math.max(0, Math.min(1, s.fill.x));
  const releasing = s.rel;
  const holding = s.holding;
  const count = s.count;
  const ringColor = hold > 0.002 ? mix(hold) : LED[led].color;
  const pulse = led === 'warning' ? 'animate-[breathe_1s_ease-in-out_infinite]' : led === 'active' && hold <= 0.002 ? 'animate-breathe' : '';

  return (
    <div className="relative h-[224px] w-[224px]">
      <svg viewBox="0 0 220 220" className="h-full w-full" role="img" aria-label={`Patch light: ${LED[led].label}`}>
        {/* Track */}
        <circle cx="110" cy="110" r={R} fill="none" stroke="#222A38" strokeWidth="2" />
        {/* Status ring */}
        {hold <= 0.002 && <circle cx="110" cy="110" r={R} fill="none" stroke={ringColor} strokeWidth="2" className={pulse} style={{ transition: 'stroke 400ms' }} />}
        {/* Hold progress */}
        {hold > 0.002 && (
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
