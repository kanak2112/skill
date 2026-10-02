import { useCallback, useEffect, useReducer, useRef } from 'react';
import { isSettled, reducedMotion, stepSpring } from '../motion/spring.js';

const AXIS_LOCK_PX = 6;

export const normDeg = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
export const mod = (n, m) => ((n % m) + m) % m;

/**
 * Motion + gesture engine for the cylindrical vault.
 *   rot — cylinder rotation in degrees (unbounded, infinite in both directions)
 *   v   — vertical row position (float; integer = row centred, infinite)
 * Horizontal drag rotates, vertical drag/swipe changes skill area. On release the
 * fling velocity seeds a damped spring (stiffness 300, damping 25) that settles on
 * the nearest slot / row, so swipes feel weighty rather than instantaneous.
 */
export function useCylinder({ slots, degPerPx = 0.24, rowPx = 260, onTap }) {
  const step = 360 / slots;
  const st = useRef({
    rot: 0,
    v: 0,
    rotV: 0, // deg/s
    vV: 0, // rows/s
    tRot: null,
    tV: null,
    drag: null,
    raf: 0,
    last: 0,
    wheelTimer: 0,
    wheelLock: 0,
  });
  const [, render] = useReducer((n) => n + 1, 0);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  const loop = useCallback((now) => {
    const s = st.current;
    const dt = s.last ? (now - s.last) / 1000 : 1 / 60;
    s.last = now;
    const instant = reducedMotion();
    let moving = false;

    if (s.tRot != null) {
      const sp = { x: s.rot, v: s.rotV };
      if (instant) sp.x = s.tRot;
      else stepSpring(sp, s.tRot, dt);
      if (instant || isSettled(sp, s.tRot, 0.02)) {
        s.rot = s.tRot;
        s.rotV = 0;
        s.tRot = null;
      } else {
        s.rot = sp.x;
        s.rotV = sp.v;
        moving = true;
      }
    }
    if (s.tV != null) {
      const sp = { x: s.v, v: s.vV };
      if (instant) sp.x = s.tV;
      else stepSpring(sp, s.tV, dt);
      if (instant || isSettled(sp, s.tV, 0.001)) {
        s.v = s.tV;
        s.vV = 0;
        s.tV = null;
      } else {
        s.v = sp.x;
        s.vV = sp.v;
        moving = true;
      }
    }
    render();
    if (moving) s.raf = requestAnimationFrame(loop);
    else {
      s.raf = 0;
      s.last = 0;
    }
  }, []);

  const kick = useCallback(() => {
    if (!st.current.raf) st.current.raf = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  /** velocity in deg/ms from the gesture; seeds the spring so a hard flick carries further. */
  const snapRot = useCallback(
    (velocity = 0) => {
      const s = st.current;
      const projected = s.rot + velocity * 160;
      s.tRot = Math.round(projected / step) * step;
      s.rotV = velocity * 1000;
      kick();
    },
    [step, kick],
  );

  const snapV = useCallback(
    (velocity = 0) => {
      const s = st.current;
      const from = Math.round(s.v);
      let target = Math.round(s.v + velocity * 180);
      target = Math.max(from - 1, Math.min(from + 1, target));
      s.tV = target;
      s.vV = velocity * 1000;
      kick();
    },
    [kick],
  );

  /** Spring so that (row k, slot i) is centred. */
  const focus = useCallback(
    (k, i) => {
      const s = st.current;
      s.tRot = s.rot + normDeg(i * step - s.rot);
      s.tV = k;
      kick();
    },
    [step, kick],
  );

  const rotateBy = useCallback(
    (slotsDelta) => {
      const s = st.current;
      const base = s.tRot ?? Math.round(s.rot / step) * step;
      s.tRot = base + slotsDelta * step;
      kick();
    },
    [step, kick],
  );

  const moveRows = useCallback(
    (delta) => {
      const s = st.current;
      s.tV = (s.tV ?? Math.round(s.v)) + delta;
      kick();
    },
    [kick],
  );

  // ── Pointer gestures ───────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    const s = st.current;
    // Catching the cylinder mid-spin stops it dead, like a finger on a real drum.
    s.tRot = null;
    s.tV = null;
    s.rotV = 0;
    s.vV = 0;
    const tile = e.target.closest('[data-slot]');
    s.drag = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: performance.now(),
      vel: 0,
      axis: null,
      rot0: s.rot,
      v0: s.v,
      tile: tile ? { row: Number(tile.dataset.row), slot: Number(tile.dataset.slot), id: tile.dataset.model } : null,
    };
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      const d = st.current.drag;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;
      if (!d.axis) {
        if (Math.hypot(dx, dy) < AXIS_LOCK_PX) return;
        d.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      const s = st.current;
      if (d.axis === 'x') {
        s.rot = d.rot0 - dx * degPerPx;
        d.vel = (-(e.clientX - d.lastX) * degPerPx) / dt;
      } else {
        s.v = d.v0 - dy / rowPx;
        d.vel = -(e.clientY - d.lastY) / rowPx / dt;
      }
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastT = now;
      render();
    },
    [degPerPx, rowPx],
  );

  const endDrag = useCallback(
    (e, cancelled) => {
      const s = st.current;
      const d = s.drag;
      if (!d || d.id !== e.pointerId) return;
      s.drag = null;
      // Velocity decays if the finger paused before lifting.
      const idle = performance.now() - d.lastT;
      const vel = idle > 80 ? 0 : d.vel;
      if (!d.axis) {
        if (!cancelled && d.tile) onTapRef.current?.(d.tile);
        snapRot();
        snapV();
        return;
      }
      if (d.axis === 'x') {
        snapRot(vel);
        snapV();
      } else {
        snapV(vel);
        snapRot();
      }
    },
    [snapRot, snapV],
  );

  const onPointerUp = useCallback((e) => endDrag(e, false), [endDrag]);
  const onPointerCancel = useCallback((e) => endDrag(e, true), [endDrag]);

  // ── Wheel / trackpad (non-passive so the page doesn't scroll) ───────────
  const attachWheel = useCallback(
    (el) => {
      if (!el) return undefined;
      const handler = (e) => {
        e.preventDefault();
        const s = st.current;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
          s.tRot = null;
          s.rot += (e.shiftKey ? e.deltaY : e.deltaX) * 0.2;
          render();
          clearTimeout(s.wheelTimer);
          s.wheelTimer = setTimeout(() => snapRot(), 120);
        } else {
          const now = performance.now();
          if (Math.abs(e.deltaY) < 12 || now < s.wheelLock) return;
          s.wheelLock = now + 450;
          moveRows(Math.sign(e.deltaY));
        }
      };
      el.addEventListener('wheel', handler, { passive: false });
      return () => el.removeEventListener('wheel', handler);
    },
    [snapRot, moveRows],
  );

  const { rot, v } = st.current;
  return {
    rot,
    v,
    step,
    centerSlot: mod(Math.round(rot / step), slots),
    centerRow: Math.round(v),
    dragging: Boolean(st.current.drag?.axis),
    focus,
    rotateBy,
    moveRows,
    attachWheel,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
