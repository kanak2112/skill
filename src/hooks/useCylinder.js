import { useCallback, useEffect, useReducer, useRef } from 'react';

const AXIS_LOCK_PX = 6;
const EASE = 0.16;

export const normDeg = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
export const mod = (n, m) => ((n % m) + m) % m;

/**
 * Motion + gesture engine for the cylindrical vault.
 *   rot — cylinder rotation in degrees (unbounded, infinite in both directions)
 *   v   — vertical row position (float; integer = row centred, infinite)
 * Horizontal drag rotates, vertical drag/swipe changes domain row. Releases
 * carry momentum and snap to the nearest slot / row.
 */
export function useCylinder({ slots, degPerPx = 0.24, rowPx = 260, onTap }) {
  const step = 360 / slots;
  const st = useRef({ rot: 0, v: 0, tRot: null, tV: null, drag: null, raf: 0, wheelX: 0, wheelTimer: 0, wheelLock: 0 });
  const [, render] = useReducer((n) => n + 1, 0);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  const loop = useCallback(() => {
    const s = st.current;
    let moving = false;
    if (s.tRot != null) {
      const d = s.tRot - s.rot;
      if (Math.abs(d) < 0.05) {
        s.rot = s.tRot;
        s.tRot = null;
      } else {
        s.rot += d * EASE;
        moving = true;
      }
    }
    if (s.tV != null) {
      const d = s.tV - s.v;
      if (Math.abs(d) < 0.002) {
        s.v = s.tV;
        s.tV = null;
      } else {
        s.v += d * EASE;
        moving = true;
      }
    }
    render();
    s.raf = moving ? requestAnimationFrame(loop) : 0;
  }, []);

  const kick = useCallback(() => {
    if (!st.current.raf) st.current.raf = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  const snapRot = useCallback(
    (velocity = 0) => {
      const s = st.current;
      const projected = s.rot + velocity * 220;
      s.tRot = Math.round(projected / step) * step;
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
      kick();
    },
    [kick],
  );

  /** Animate so that (row k, slot i) is centred. */
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
    s.tRot = null;
    s.tV = null;
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
