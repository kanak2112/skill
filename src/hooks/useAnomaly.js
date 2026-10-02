import { useCallback, useEffect, useRef, useState } from 'react';

const FIRST_AT_MS = 8000;
const EVERY_MS = 35000;
const STABILISE_MS = 6000;

/**
 * Simulated anomalous-response detector. While a stream is active it raises a
 * motor-variance warning shortly after start and then periodically; each event
 * auto-stabilises over a few seconds. `trigger()` fires one on demand.
 * phase: 'none' | 'stabilizing' | 'resolved'
 */
export function useAnomaly(active) {
  const [phase, setPhase] = useState('none');
  const [progress, setProgress] = useState(0);
  const timers = useRef([]);

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t) || clearInterval(t));
    timers.current = [];
  };

  const trigger = useCallback(() => {
    clear();
    setPhase('stabilizing');
    setProgress(0);
    const started = performance.now();
    const tick = setInterval(() => {
      const p = Math.min(1, (performance.now() - started) / STABILISE_MS);
      setProgress(p);
      if (p >= 1) {
        clearInterval(tick);
        setPhase('resolved');
        timers.current.push(setTimeout(() => setPhase('none'), 3000));
      }
    }, 100);
    timers.current.push(tick);
  }, []);

  useEffect(() => {
    if (!active) {
      clear();
      setPhase('none');
      return undefined;
    }
    const first = setTimeout(trigger, FIRST_AT_MS);
    const every = setInterval(trigger, EVERY_MS);
    return () => {
      clearTimeout(first);
      clearInterval(every);
      clear();
    };
  }, [active, trigger]);

  return { phase, progress, trigger };
}
