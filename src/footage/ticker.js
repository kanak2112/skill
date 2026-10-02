// One requestAnimationFrame loop shared by every footage canvas, throttled to
// ~30 fps. Subscribers receive the elapsed seconds since their last call.

const FRAME_MS = 1000 / 30;
const subscribers = new Set();
let raf = 0;
let last = 0;

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function loop(now) {
  raf = requestAnimationFrame(loop);
  if (now - last < FRAME_MS) return;
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  subscribers.forEach((fn) => fn(dt));
}

export function subscribe(fn) {
  subscribers.add(fn);
  fn(0);
  if (!reducedMotion && !raf) {
    last = 0;
    raf = requestAnimationFrame(loop);
  }
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}
