import { motion } from '../theme/tokens.js';

const STEP = 1 / 240; // fixed integration step (s) so behaviour is frame-rate independent

/**
 * Advance a damped spring { x, v } toward `target` by `dt` seconds.
 * Semi-implicit Euler: F = -k(x - target) - c·v, a = F / m.
 * With k = 300, c = 25, m = 1 the damping ratio is ≈0.72: a short, weighty
 * settle with a slight overshoot, matching Figma's / ProtoPie's spring curve.
 */
export function stepSpring(s, target, dt, { stiffness, damping, mass } = motion.spring) {
  let remaining = Math.min(dt, 0.064);
  while (remaining > 0) {
    const h = Math.min(STEP, remaining);
    const force = -stiffness * (s.x - target) - damping * s.v;
    s.v += (force / mass) * h;
    s.x += s.v * h;
    remaining -= h;
  }
  return s;
}

export const isSettled = (s, target, eps = 0.01) => Math.abs(s.x - target) < eps && Math.abs(s.v) < eps * 10;

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Fire a haptic pattern where the platform supports it (Android Chrome); silently no-op elsewhere. */
export function haptic(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
