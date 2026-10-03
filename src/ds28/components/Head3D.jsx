import { useEffect, useRef, useState } from 'react';
import PatchSVG from './PatchSVG.jsx';
import { presetShape } from '../shapes.js';

/** Shapes the hero patch cycles through, one per head rotation. */
export const MORPHS = [
  { shape: 'anger', color: '#ff2a4b', name: 'Anger Glyph' },
  { shape: 'bolt', color: '#00f0ff', name: 'Volt Bolt' },
  { shape: 'tear', color: '#ffb703', name: 'Teardrop' },
  { shape: 'hex', color: '#b7c4dd', name: 'Hex Mesh' },
];

const LAT = 30;
const LON = 40;
const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const bump = (d, c, width, amt) => amt * Math.exp(-((1 - dot(d, norm(c))) / width));

/** Procedural head: a deformed sphere (brow, eye sockets, nose, cheekbones, jaw taper) plus a neck. */
function buildHead() {
  const rows = [];
  for (let i = 0; i <= LAT; i += 1) {
    const phi = (i / LAT) * Math.PI;
    const row = [];
    for (let j = 0; j < LON; j += 1) {
      const th = (j / LON) * Math.PI * 2;
      const d = [Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th)];
      let r = 1;
      r += bump(d, [0, -0.1, 1], 0.006, 0.26); // nose tip
      r += bump(d, [0, 0.08, 1], 0.004, 0.1); // nose bridge
      r += bump(d, [0.3, 0.3, 1], 0.012, 0.07); // brow ridge
      r += bump(d, [-0.3, 0.3, 1], 0.012, 0.07);
      r -= bump(d, [0.31, 0.15, 1], 0.008, 0.12); // eye sockets
      r -= bump(d, [-0.31, 0.15, 1], 0.008, 0.12);
      r += bump(d, [0.52, -0.08, 0.85], 0.02, 0.06); // cheekbones
      r += bump(d, [-0.52, -0.08, 0.85], 0.02, 0.06);
      r += bump(d, [0, -0.33, 1], 0.004, 0.07); // lips
      r -= bump(d, [0, -0.43, 1], 0.003, 0.04); // under-lip
      r += bump(d, [0, -0.62, 0.85], 0.012, 0.12); // chin
      r += bump(d, [1, 0.04, -0.08], 0.005, 0.16); // ears
      r += bump(d, [-1, 0.04, -0.08], 0.005, 0.16);
      let x = d[0] * r * 0.8;
      const y = d[1] * r * 1.04;
      let z = d[2] * r * (d[2] < 0 ? 0.98 : 0.9);
      if (y < -0.15) {
        const t = Math.min(1, (-y - 0.15) / 0.9);
        x *= 1 - 0.38 * t; // jaw taper
        z *= 1 - (d[2] < 0 ? 0.42 : 0.1) * t;
      }
      row.push([x, y, z]);
    }
    rows.push(row);
  }
  const neck = [];
  for (let i = 0; i < 5; i += 1) {
    const y = -0.72 - i * 0.2;
    const row = [];
    for (let j = 0; j < LON; j += 1) {
      const th = (j / LON) * Math.PI * 2;
      const rr = 0.36 + i * 0.015;
      row.push([Math.sin(th) * rr, y, Math.cos(th) * rr * 0.92 - 0.12]);
    }
    neck.push(row);
  }
  return { rows: withNormals(rows, false), neck: withNormals(neck, true) };
}

/** Attach a per-vertex normal (from neighbouring grid points) for wireframe lighting. */
function withNormals(rows, isNeck) {
  return rows.map((row, i) =>
    row.map((v, j) => {
      const up = rows[Math.max(0, i - 1)][j];
      const dn = rows[Math.min(rows.length - 1, i + 1)][j];
      const lf = row[(j - 1 + row.length) % row.length];
      const rt = row[(j + 1) % row.length];
      const a = [dn[0] - up[0], dn[1] - up[1], dn[2] - up[2]];
      const b = [rt[0] - lf[0], rt[1] - lf[1], rt[2] - lf[2]];
      let n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      if (!isNeck && dot(n, v) < 0) n = n.map((c) => -c);
      if (isNeck && n[0] * v[0] + n[2] * (v[2] + 0.12) < 0) n = n.map((c) => -c);
      const l = Math.hypot(...n) || 1;
      return { v, n: [n[0] / l, n[1] / l, n[2] / l] };
    }),
  );
}
const LIGHT = norm([-0.5, 0.6, 0.8]);

const HEAD = buildHead();
const TEMPLE = { p: [0.7, 0.2, 0.38], n: norm([0.9, 0.12, 0.42]) };
const CERVICAL = { p: [0.3, -0.98, 0.1], n: norm([0.9, 0, 0.4]) };
const CYCLE_MS = 9000;

/**
 * Rotating wireframe head on a canvas. The temple patch is a DOM overlay rotated with real
 * CSS 3D transforms, so its bevel and glow stay crisp. It morphs each time it turns away.
 */
export default function Head3D({ leaving = false, onMorph }) {
  const canvas = useRef(null);
  const patch = useRef(null);
  const node = useRef(null);
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const drag = useRef({ on: false, x: 0, offset: 0 });
  const onMorphRef = useRef(onMorph);
  onMorphRef.current = onMorph;

  useEffect(() => {
    const c = canvas.current;
    const ctx = c.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const t0 = performance.now();

    const frame = (now) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const elapsed = (now - t0) * (reduce ? 0.35 : 1);
      // Start with the temple facing the viewer at three-quarter view.
      const yaw = (elapsed / CYCLE_MS) * Math.PI * 2 - 0.9 + drag.current.offset;
      const pitch = -0.12 + Math.sin(elapsed / 3100) * 0.05;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const rot = ([x, y, z]) => {
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
      };
      const scale = Math.min(w, h) * 0.34;
      const cam = 4.2;
      const ox = w / 2;
      const oy = h / 2 + scale * 0.22;
      const proj = ([x, y, z]) => {
        const k = cam / (cam - z);
        return [ox + x * scale * k, oy - y * scale * k, z, k];
      };

      const m = MORPHS[idxRef.current];
      const tP = rot(TEMPLE.p);
      const tN = rot(TEMPLE.n);
      const facing = tN[2];

      // The patch morphs while it is hidden behind the head.
      const cycle = Math.floor((yaw + 0.9 + Math.PI * 0.55) / (Math.PI * 2));
      const want = ((cycle % MORPHS.length) + MORPHS.length) % MORPHS.length;
      if (want !== idxRef.current) {
        idxRef.current = want;
        setIdx(want);
        onMorphRef.current?.(want);
      }

      const drawGrid = (rows, closedRows, isNeck) => {
        const P = rows.map((r) => r.map(({ v, n }) => {
          const rv = rot(v);
          const rn = rot(n);
          return {
            s: proj(rv),
            w: rv,
            lit: Math.max(0, dot(rn, LIGHT)),
            face: rn[2],
            near: Math.hypot(v[0] - TEMPLE.p[0], v[1] - TEMPLE.p[1], v[2] - TEMPLE.p[2]),
          };
        }));
        const seg = (a, b) => {
          const front = (a.face + b.face) / 2 > 0;
          const lit = (a.lit + b.lit) / 2;
          const glow = Math.max(0, 1 - Math.min(a.near, b.near) / 0.42) * Math.max(0, facing);
          ctx.strokeStyle = glow > 0.05 ? m.color : front ? '#8fa6cf' : '#2a3246';
          ctx.globalAlpha = glow > 0.05 ? 0.35 + glow * 0.6 : front ? 0.08 + lit * 0.62 : 0.07;
          ctx.lineWidth = glow > 0.05 ? 1.1 : 0.7;
          ctx.beginPath();
          ctx.moveTo(a.s[0], a.s[1]);
          ctx.lineTo(b.s[0], b.s[1]);
          ctx.stroke();
        };
        for (let i = 0; i < P.length; i += 1) {
          for (let j = 0; j < P[i].length; j += 1) {
            const a = P[i][j];
            if (closedRows || j < P[i].length - 1) seg(a, P[i][(j + 1) % P[i].length]);
            if (i < P.length - 1) seg(a, P[i + 1][j]);
          }
        }
        if (!isNeck) {
          // Vertex sparkle on the front surface.
          ctx.fillStyle = '#cfdcf5';
          for (let i = 2; i < P.length - 2; i += 2)
            for (let j = 0; j < P[i].length; j += 2) {
              const p = P[i][j];
              if (p.face > 0.2) {
                ctx.globalAlpha = 0.45 * p.lit;
                ctx.fillRect(p.s[0] - 0.75, p.s[1] - 0.75, 1.5, 1.5);
              }
            }
        }
        ctx.globalAlpha = 1;
      };
      drawGrid(HEAD.neck, true, true);
      drawGrid(HEAD.rows, true, false);

      // Patch overlay: CSS 3D rotation matches the surface normal.
      const ps = proj(tP);
      const size = scale * 0.42 * ps[3];
      const ry = Math.atan2(tN[0], tN[2]);
      const rx = -Math.asin(Math.max(-1, Math.min(1, tN[1])));
      if (patch.current) {
        const vis = Math.max(0, Math.min(1, (facing + 0.05) * 4));
        patch.current.style.transform = `translate(${ps[0] - size / 2}px, ${ps[1] - size / 2}px) perspective(${scale * 5}px) rotateY(${ry}rad) rotateX(${rx}rad)`;
        patch.current.style.width = `${size}px`;
        patch.current.style.height = `${size}px`;
        patch.current.style.opacity = vis;
      }
      if (facing > 0) {
        const g = ctx.createRadialGradient(ps[0], ps[1], 0, ps[0], ps[1], size * 1.4);
        g.addColorStop(0, `${m.color}55`);
        g.addColorStop(1, `${m.color}00`);
        ctx.fillStyle = g;
        ctx.globalAlpha = facing;
        ctx.fillRect(ps[0] - size * 1.5, ps[1] - size * 1.5, size * 3, size * 3);
        ctx.globalAlpha = 1;
      }

      const cP = proj(rot(CERVICAL.p));
      const cF = rot(CERVICAL.n)[2];
      if (node.current) {
        node.current.style.transform = `translate(${cP[0]}px, ${cP[1]}px)`;
        node.current.style.opacity = Math.max(0, Math.min(1, cF * 3));
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const m = MORPHS[idx];
  const down = (e) => {
    drag.current.on = true;
    drag.current.x = e.clientX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current.on) return;
    drag.current.offset += (e.clientX - drag.current.x) * 0.01;
    drag.current.x = e.clientX;
  };
  const up = () => {
    drag.current.on = false;
  };

  return (
    <div
      className={`head3d ${leaving ? 'leaving' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      role="img"
      aria-label={`Rotating wireframe head wearing a ${m.name} patch on the temple`}
    >
      <canvas ref={canvas} />
      <div ref={patch} className="head-patch">
        <div key={idx} className="morph-in">
          <PatchSVG shape={presetShape(m.shape)} color={m.color} coating="gloss" glow={1} />
        </div>
      </div>
      <span ref={node} className="head-node" />
    </div>
  );
}
