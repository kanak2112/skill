// Procedural first-person "footage" loops, drawn on canvas.
// Each scene is (ctx, w, h, t, variant) => void, where t is seconds.
// They stand in for real muted video until clips are supplied (see catalog.js).

const TAU = Math.PI * 2;
const SKIN = '#b07a5c';
const SKIN_DARK = '#8f5f46';

function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function fill(ctx, color) {
  ctx.fillStyle = color;
  ctx.fill();
}

function vGradient(ctx, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
}

function hand(ctx, x, y, rx, ry, rot = 0, color = SKIN) {
  ellipse(ctx, x, y, rx, ry, rot);
  fill(ctx, color);
  ctx.strokeStyle = SKIN_DARK;
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    const ox = Math.cos(rot) * i * rx * 0.35;
    const oy = Math.sin(rot) * i * rx * 0.35;
    ctx.moveTo(x + ox - Math.sin(rot) * ry * 0.2, y + oy + Math.cos(rot) * ry * 0.2);
    ctx.lineTo(x + ox - Math.sin(rot) * ry * 0.85, y + oy + Math.cos(rot) * ry * 0.85);
    ctx.stroke();
  }
}

// ── Culinary ──────────────────────────────────────────────────────────────

function knife(ctx, w, h, t, variant) {
  ctx.fillStyle = vGradient(ctx, h, [
    [0, '#4a3526'],
    [1, '#2b1d14'],
  ]);
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 10; i++) {
    const y = (i / 10) * h + Math.sin(i * 3) * 6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3);
    ctx.stroke();
  }

  const veg = variant ? ['#6f9a3c', '#c9dd9a'] : ['#c8662d', '#e7a066'];
  const vy = h * 0.6;
  const vh = h * 0.1;
  const x0 = w * 0.08;
  const x1 = w * 0.92;
  const cycle = variant ? 2.6 : 3.4;
  const p = (t % cycle) / cycle;
  const start = x1 - (x1 - x0) * 0.12;
  const cutX = start - p * (x1 - x0) * 0.62;

  // Uncut body
  ctx.beginPath();
  ctx.roundRect(x0, vy - vh / 2, cutX - x0, vh, vh / 2);
  fill(ctx, veg[0]);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x0 + vh / 2, vy - vh / 2 + 2, cutX - x0 - vh, vh * 0.18);

  // Slices
  const sliceW = 5;
  for (let sx = cutX + 3, j = 0; sx < start; sx += sliceW + 3, j++) {
    const lean = Math.min(1, (sx - cutX) / 30) * 2;
    ctx.beginPath();
    ctx.roundRect(sx + lean, vy - vh / 2 + 1, sliceW, vh - 2, 2);
    fill(ctx, veg[1]);
  }

  // Knife
  const chop = Math.abs(Math.sin(t * TAU * (variant ? 2.8 : 2.2)));
  const by = vy + vh / 2 - chop * vh * 1.5;
  const bladeTop = by - h * 0.3;
  ctx.beginPath();
  ctx.moveTo(cutX - 1, by);
  ctx.lineTo(cutX + 7, by - 4);
  ctx.lineTo(cutX + 11, bladeTop);
  ctx.lineTo(cutX - 3, bladeTop);
  ctx.closePath();
  const steel = ctx.createLinearGradient(cutX - 3, 0, cutX + 11, 0);
  steel.addColorStop(0, '#e5eaee');
  steel.addColorStop(1, '#8d969e');
  fill(ctx, steel);
  ctx.beginPath();
  ctx.roundRect(cutX - 3, bladeTop - h * 0.2, 15, h * 0.2, 3);
  fill(ctx, '#1d1b1a');
  hand(ctx, cutX + 10, bladeTop - h * 0.14, 24, 18, -0.4);

  // Guiding hand (claw grip)
  hand(ctx, cutX - 30, vy - vh * 1.1, 28, 16, 0.25);
}

function flame(ctx, w, h, t) {
  ctx.fillStyle = '#140d0a';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.6;
  const rx = w * 0.42;
  const ry = h * 0.19;
  ellipse(ctx, cx, cy, rx + 10, ry + 8);
  fill(ctx, '#5a3a25');
  const g = ctx.createRadialGradient(cx, cy + ry * 0.4, 4, cx, cy, rx);
  g.addColorStop(0, '#ffb35c');
  g.addColorStop(0.5, '#a3401a');
  g.addColorStop(1, '#1a0a05');
  ellipse(ctx, cx, cy, rx, ry);
  fill(ctx, g);

  for (let i = 0; i < 7; i++) {
    const x = cx + (i - 3) * rx * 0.24;
    const fh = h * 0.16 * (0.55 + 0.45 * Math.sin(t * 6 + i * 1.7));
    const sway = Math.sin(t * 5 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(x - 9, cy);
    ctx.quadraticCurveTo(x - 6 + sway, cy - fh * 0.6, x + sway, cy - fh);
    ctx.quadraticCurveTo(x + 6 + sway, cy - fh * 0.6, x + 9, cy);
    fill(ctx, 'rgba(255,150,60,0.7)');
  }

  // Skewer with paneer
  const off = Math.sin(t * 1.2) * 12;
  ctx.strokeStyle = '#a7a9ab';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 1.05 + off, h * 0.98 + off);
  ctx.lineTo(cx - 10 + off, cy - ry * 0.3 + off);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const k = 0.25 + i * 0.16;
    const px = w * 1.05 + off + (cx - 10 - w * 1.05) * k;
    const py = h * 0.98 + off + (cy - ry * 0.3 - h * 0.98) * k;
    ctx.beginPath();
    ctx.roundRect(px - 7, py - 7, 14, 14, 3);
    fill(ctx, i % 2 ? '#d98b3a' : '#ead2a0');
  }
  hand(ctx, w * 0.95 + off, h * 0.95 + off, 26, 18, -0.8);
}

function wok(ctx, w, h, t) {
  ctx.fillStyle = '#111418';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.66;
  // Burner
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    const fl = 8 + Math.sin(t * 9 + i) * 3;
    ctx.strokeStyle = i % 2 ? 'rgba(96,165,250,0.8)' : 'rgba(251,146,60,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * w * 0.2, cy + h * 0.1 + Math.sin(a) * 8);
    ctx.lineTo(cx + Math.cos(a) * w * 0.2, cy + h * 0.1 + Math.sin(a) * 8 - fl);
    ctx.stroke();
  }
  const phase = (t * 0.8) % 1;
  const toss = Math.sin(phase * Math.PI);
  const lift = toss * h * 0.05;
  const tilt = toss * 0.12;
  ellipse(ctx, cx, cy - lift, w * 0.4, h * 0.12, tilt);
  fill(ctx, '#2a2a2c');
  ctx.strokeStyle = '#5b5d61';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#3a3330';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.38, cy - lift);
  ctx.lineTo(-10, cy + h * 0.2);
  ctx.stroke();
  hand(ctx, w * 0.05, cy + h * 0.18 - lift, 24, 17, 0.5);

  const colors = ['#f2e6c9', '#d9a441', '#6aa84f', '#f2e6c9'];
  for (let j = 0; j < 28; j++) {
    const r = hash(j);
    const px = cx - w * 0.26 + r * w * 0.52 + Math.sin(phase * TAU + j) * 3;
    const py = cy - lift - 4 - toss * h * (0.12 + 0.18 * hash(j + 9));
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, TAU);
    fill(ctx, colors[j % 4]);
  }
}

// ── Craft ─────────────────────────────────────────────────────────────────

function lathe(ctx, w, h, t) {
  ctx.fillStyle = '#1b1612';
  ctx.fillRect(0, 0, w, h);
  const top = h * 0.32;
  const bot = h * 0.56;
  const x0 = w * 0.04;
  const x1 = w * 0.96;
  const bands = ['#c9a27a', '#b8352b', '#e0a526', '#3c7a4a', '#c9a27a', '#b8352b', '#e0a526'];
  const bw = (x1 - x0) / bands.length;
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x0 + i * bw, top, bw + 1, bot - top);
  });
  // Spinning grain marks
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, top, x1 - x0, bot - top);
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const period = 14;
  const off = (t * 90) % period;
  for (let y = top - period + off; y < bot; y += period) {
    for (let i = 0; i < bands.length; i++) ctx.fillRect(x0 + i * bw + bw * hash(i) * 0.6, y, 6, 2);
  }
  ctx.restore();
  const shade = ctx.createLinearGradient(0, top, 0, bot);
  shade.addColorStop(0, 'rgba(0,0,0,0.45)');
  shade.addColorStop(0.35, 'rgba(255,255,255,0.12)');
  shade.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(x0, top, x1 - x0, bot - top);

  // Chisel
  const cx = w * 0.3 + (Math.sin(t * 0.8) * 0.5 + 0.5) * w * 0.4;
  ctx.beginPath();
  ctx.moveTo(cx - 3, bot + 2);
  ctx.lineTo(cx + 3, bot + 2);
  ctx.lineTo(cx + 9, h * 0.82);
  ctx.lineTo(cx - 3, h * 0.82);
  fill(ctx, '#9aa1a8');
  ctx.beginPath();
  ctx.roundRect(cx - 5, h * 0.82, 16, h * 0.2, 3);
  fill(ctx, '#5b4030');
  hand(ctx, cx + 4, h * 0.9, 24, 18, 0.1);

  for (let j = 0; j < 10; j++) {
    const ph = (t * 1.6 + hash(j)) % 1;
    ctx.beginPath();
    ctx.ellipse(cx + ph * 40 * (hash(j + 3) - 0.3), bot + 4 + ph * 50, 3, 1.4, j, 0, TAU);
    fill(ctx, `rgba(214,175,120,${1 - ph})`);
  }
}

function wheel(ctx, w, h, t) {
  ctx.fillStyle = '#16191d';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.55;
  ellipse(ctx, cx, cy, w * 0.46, w * 0.46);
  fill(ctx, '#3b3f45');
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 12; k++) {
    const a = t * 4 + (k * TAU) / 12;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * w * 0.3, cy + Math.sin(a) * w * 0.3);
    ctx.lineTo(cx + Math.cos(a) * w * 0.44, cy + Math.sin(a) * w * 0.44);
    ctx.stroke();
  }
  ellipse(ctx, cx, cy, w * 0.26, w * 0.26);
  fill(ctx, '#e8e2d6');
  ctx.fillStyle = '#2d5ba8';
  for (let k = 0; k < 6; k++) {
    const a = t * 4 + (k * TAU) / 6;
    ellipse(ctx, cx + Math.cos(a) * w * 0.19, cy + Math.sin(a) * w * 0.19, 5, 3, a);
    ctx.fill();
  }
  ellipse(ctx, cx, cy, w * 0.13, w * 0.13);
  fill(ctx, '#bdb4a3');
  ctx.strokeStyle = '#2d5ba8';
  ctx.lineWidth = 2;
  ctx.stroke();
  const sway = Math.sin(t * 1.4) * 3;
  hand(ctx, cx - w * 0.3 + sway, cy + 6, 22, 17, 1.4);
  hand(ctx, cx + w * 0.3 - sway, cy + 6, 22, 17, -1.4);
}

function solder(ctx, w, h, t) {
  ctx.fillStyle = '#0f3b2e';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#1f6b4f';
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (i * h) / 6);
    ctx.lineTo(w * (0.3 + hash(i) * 0.6), (i * h) / 6);
    ctx.lineTo(w * (0.3 + hash(i) * 0.6) + 14, (i * h) / 6 + 14);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.roundRect(w * 0.3, h * 0.42, w * 0.4, h * 0.2, 2);
  fill(ctx, '#15181c');
  const pads = [];
  for (let i = 0; i < 6; i++) {
    pads.push([w * 0.32 + i * w * 0.07, h * 0.4]);
    pads.push([w * 0.32 + i * w * 0.07, h * 0.64]);
  }
  pads.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.roundRect(x - 3, y - 3, 6, 6, 1);
    fill(ctx, '#c9a95c');
  });

  const seq = [1, 3, 5, 7, 9, 11];
  const step = 1.3;
  const idx = Math.floor(t / step) % seq.length;
  const local = (t % step) / step;
  const [ax, ay] = pads[seq[idx]];
  const [bx, by] = pads[seq[(idx + 1) % seq.length]];
  const m = Math.min(1, local / 0.3);
  const tx = ax + (bx - ax) * m;
  const ty = ay + (by - ay) * m;

  if (local > 0.3) {
    const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 12);
    g.addColorStop(0, 'rgba(255,210,122,0.9)');
    g.addColorStop(1, 'rgba(255,210,122,0)');
    ctx.fillStyle = g;
    ctx.fillRect(tx - 12, ty - 12, 24, 24);
    ctx.strokeStyle = 'rgba(220,220,220,0.25)';
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let s = 0; s < 20; s++) {
        const yy = ty - s * 3;
        const xx = tx + Math.sin(s * 0.5 + t * 4 + k * 2) * (2 + s * 0.4);
        s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    }
  }
  ctx.strokeStyle = '#8a8f96';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(w * 1.1, -h * 0.05);
  ctx.stroke();
  ctx.strokeStyle = '#2b2f36';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(tx + (w * 1.1 - tx) * 0.55, ty + (-h * 0.05 - ty) * 0.55);
  ctx.lineTo(w * 1.1, -h * 0.05);
  ctx.stroke();
  ctx.strokeStyle = '#c0c4c8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, h * 0.1);
  ctx.quadraticCurveTo(w * 0.2, h * 0.2, tx - 6, ty - 4);
  ctx.stroke();
}

function suture(ctx, w, h, t) {
  ctx.fillStyle = '#2f5d6b';
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.roundRect(w * 0.12, h * 0.12, w * 0.76, h * 0.76, 8);
  fill(ctx, '#c89a84');
  const cx = w / 2;
  const y0 = h * 0.2;
  const y1 = h * 0.8;
  ctx.strokeStyle = '#8b3a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, y0);
  ctx.lineTo(cx, y1);
  ctx.stroke();

  const cycle = 1.4;
  const done = Math.floor((t % (cycle * 5)) / cycle);
  const local = (t % cycle) / cycle;
  ctx.strokeStyle = '#1b2a4a';
  ctx.lineWidth = 2;
  for (let i = 0; i < done; i++) {
    const y = y0 + 16 + i * ((y1 - y0 - 32) / 4);
    ctx.beginPath();
    ctx.moveTo(cx - 10, y);
    ctx.lineTo(cx + 10, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 10, y, 2, 0, TAU);
    fill(ctx, '#1b2a4a');
  }
  const ny = y0 + 16 + done * ((y1 - y0 - 32) / 4);
  const a = Math.PI + local * Math.PI;
  ctx.strokeStyle = '#d7dde2';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, ny, 12, a - 1.6, a);
  ctx.stroke();
  const nx = cx + Math.cos(a) * 12;
  const nyy = ny + Math.sin(a) * 12;
  ctx.strokeStyle = '#1b2a4a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(a - 1.6) * 12, ny + Math.sin(a - 1.6) * 12);
  ctx.quadraticCurveTo(cx + 30, ny - 20, w * 0.95, h * 0.2);
  ctx.stroke();
  // Needle driver + gloved hand
  ctx.strokeStyle = '#9aa1a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(nx, nyy);
  ctx.lineTo(w * 1.05, h * 0.95);
  ctx.stroke();
  hand(ctx, w * 0.9, h * 0.9, 26, 18, -0.7, '#7fb3c8');
}

// ── Physical ──────────────────────────────────────────────────────────────

function stride(ctx, w, h, t, variant) {
  const speed = variant ? 1.9 : 1;
  const bob = Math.sin(t * TAU * 1.5 * speed) * 2;
  ctx.save();
  ctx.translate(0, bob);
  const horizon = h * 0.4;
  ctx.fillStyle = vGradient(ctx, horizon, [
    [0, variant ? '#2c3846' : '#5b6b7d'],
    [1, variant ? '#5c6b78' : '#b6b3a8'],
  ]);
  ctx.fillRect(0, -4, w, horizon + 4);
  ctx.fillStyle = variant ? '#2f5e3a' : '#4f5f3a';
  ctx.fillRect(0, horizon, w, h - horizon + 4);
  ctx.beginPath();
  ctx.moveTo(w * 0.46, horizon);
  ctx.lineTo(w * 0.54, horizon);
  ctx.lineTo(w * 1.15, h + 4);
  ctx.lineTo(-w * 0.15, h + 4);
  fill(ctx, variant ? '#8c3b2f' : '#3b3b3e');

  ctx.fillStyle = variant ? 'rgba(255,255,255,0.8)' : 'rgba(240,240,240,0.7)';
  for (let j = 0; j < 8; j++) {
    const z = (j / 8 + t * 0.6 * speed) % 1;
    const y = horizon + (h - horizon) * z * z;
    const dh = 2 + z * z * 22;
    const dw = 1 + z * 4;
    if (variant) {
      [-0.3, 0.3].forEach((s) => {
        const x = w / 2 + s * w * (0.08 + z * z * 0.9);
        ctx.fillRect(x - dw / 2, y, dw, dh);
      });
    } else {
      ctx.fillRect(w / 2 - dw / 2, y, dw, dh);
    }
  }
  // Roadside posts
  ctx.fillStyle = 'rgba(30,30,30,0.6)';
  for (let j = 0; j < 4; j++) {
    const z = (j / 4 + t * 0.6 * speed) % 1;
    const y = horizon + (h - horizon) * z * z;
    const x = w / 2 + w * (0.06 + z * z * 1.1);
    const ph = 6 + z * z * 90;
    ctx.fillRect(x, y - ph, 2 + z * 4, ph);
    ctx.fillRect(w - x - (2 + z * 4), y - ph, 2 + z * 4, ph);
  }
  ctx.restore();

  const s = Math.sin(t * TAU * 1.5 * speed);
  const shoe = variant ? ['#f4f4f4', '#e11d48'] : ['#e4572e', '#f4f4f4'];
  [
    [w * 0.3, s],
    [w * 0.7, -s],
  ].forEach(([x, k]) => {
    const lift = Math.max(0, k);
    const y = h * 0.95 - lift * h * 0.14;
    const sc = 1 - lift * 0.25;
    ellipse(ctx, x, y + 5, 22 * sc, 12 * sc);
    fill(ctx, shoe[1]);
    ellipse(ctx, x, y, 20 * sc, 13 * sc);
    fill(ctx, shoe[0]);
  });
}

function climb(ctx, w, h, t) {
  ctx.fillStyle = '#6d6a66';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i = 0; i < 60; i++) ctx.fillRect(hash(i) * w, hash(i + 50) * h, 2, 2);
  const colors = ['#e0533d', '#3f8fd2', '#f2c94c', '#6fbf73'];
  for (let j = 0; j < 12; j++) {
    const y = ((j * 67 + t * 22) % (h + 60)) - 30;
    const x = w * (0.1 + hash(j) * 0.8);
    ellipse(ctx, x, y, 9 + hash(j + 4) * 6, 7 + hash(j + 7) * 4, hash(j) * 3);
    fill(ctx, colors[j % 4]);
  }
  const s = Math.sin(t * 1.6);
  hand(ctx, w * 0.32, h * 0.36 + s * h * 0.08, 18, 22, 0.2, '#c79b80');
  hand(ctx, w * 0.68, h * 0.36 - s * h * 0.08, 18, 22, -0.2, '#c79b80');
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, w * 0.32, h * 0.33 + s * h * 0.08, 8, 6);
  ctx.fill();
  ellipse(ctx, w * 0.68, h * 0.33 - s * h * 0.08, 8, 6);
  ctx.fill();
}

function water(ctx, w, h, t) {
  ctx.fillStyle = vGradient(ctx, h, [
    [0, '#0b3a5b'],
    [1, '#0e5a7a'],
  ]);
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 11; i++) {
    const y = h * 0.12 + i * h * 0.08;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const yy = y + Math.sin(x * 0.05 + t * 2 + i) * 3;
      x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
    }
    ctx.stroke();
  }
  const cycle = (t * 0.7) % 2;
  const right = cycle >= 1;
  const p = cycle % 1;
  const sx = right ? w * 0.72 : w * 0.28;
  const a = Math.PI / 2 + (right ? -1 : 1) * (0.5 - p) * 0.8;
  const len = h * (0.25 + 0.4 * Math.sin(p * Math.PI));
  const ex = sx + Math.cos(a) * len;
  const ey = h * 1.05 - Math.sin(a) * len;
  ctx.strokeStyle = SKIN;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, h * 1.05);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.lineCap = 'butt';
  hand(ctx, ex, ey, 12, 16, Math.PI / 2 - a);
  if (p > 0.75) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let j = 0; j < 8; j++) {
      ctx.beginPath();
      ctx.arc(ex + (hash(j) - 0.5) * 30, ey + (hash(j + 2) - 0.5) * 20, 1.8, 0, TAU);
      ctx.fill();
    }
  }
}

// ── Cognitive ─────────────────────────────────────────────────────────────

function drive(ctx, w, h, t) {
  const horizon = h * 0.36;
  ctx.fillStyle = vGradient(ctx, horizon, [
    [0, '#7d93a6'],
    [1, '#b9c2c4'],
  ]);
  ctx.fillRect(0, 0, w, horizon);
  // Sea (Marine Drive) left, buildings right
  ctx.fillStyle = '#4d6f86';
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(w * 0.44, horizon);
  ctx.lineTo(0, h * 0.62);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const bx = w * 0.56 + i * w * 0.08;
    const bh = h * (0.08 + hash(i) * 0.14) * (1 + i * 0.25);
    ctx.fillStyle = i % 2 ? '#6e6a62' : '#5b5f66';
    ctx.fillRect(bx, horizon - bh, w * 0.08 + 1, bh + (i * h) / 40);
  }
  ctx.fillStyle = '#3a3d42';
  ctx.beginPath();
  ctx.moveTo(w * 0.44, horizon);
  ctx.lineTo(w * 0.56, horizon);
  ctx.lineTo(w * 1.3, h);
  ctx.lineTo(-w * 0.3, h);
  ctx.fill();
  ctx.fillStyle = 'rgba(245,245,245,0.75)';
  for (let j = 0; j < 7; j++) {
    const z = (j / 7 + t * 0.45) % 1;
    const y = horizon + (h - horizon) * z * z;
    const dw = 1 + z * 3;
    [-1, 1].forEach((s) => {
      const x = w / 2 + s * w * (0.02 + z * z * 0.3);
      ctx.fillRect(x - dw / 2, y, dw, 2 + z * z * 18);
    });
  }
  // Taxi ahead
  const tx = w / 2 + Math.sin(t * 0.6) * 10;
  const ty = h * 0.47;
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(tx - 18, ty, 36, 16);
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(tx - 16, ty - 9, 32, 10);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(tx - 16, ty + 4, 5, 3);
  ctx.fillRect(tx + 11, ty + 4, 5, 3);

  // Dashboard + wheel
  ctx.fillStyle = '#16181b';
  ctx.fillRect(0, h * 0.76, w, h * 0.24);
  const rot = Math.sin(t * 0.7) * 0.25;
  const wx = w * 0.42;
  const wy = h * 1.02;
  const wr = w * 0.36;
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.arc(wx, wy, wr, Math.PI + 0.15, TAU - 0.15);
  ctx.stroke();
  [-0.9, 0.9].forEach((o) => {
    const a = -Math.PI / 2 + o + rot;
    hand(ctx, wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, 15, 12, a + Math.PI / 2);
  });
}

const PROBLEMS = [
  ['4,872 × 37', '180,264'],
  ['9,216 ÷ 48', '192'],
  ['763 × 584', '445,592'],
  ['√15,129', '123'],
];

function numbers(ctx, w, h, t) {
  ctx.fillStyle = '#0e1320';
  ctx.fillRect(0, 0, w, h);
  ctx.font = '500 10px "Google Sans Flex", sans-serif';
  ctx.textAlign = 'center';
  const tick = Math.floor(t * 4);
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = 'rgba(148,163,184,0.14)';
      ctx.fillText(String(Math.floor(hash(r * 31 + c * 7 + tick) * 10)), (c + 0.5) * (w / 8), (r + 1) * (h / 14));
    }
  }
  const cycle = 2.6;
  const idx = Math.floor(t / cycle) % PROBLEMS.length;
  const p = (t % cycle) / cycle;
  const [q, a] = PROBLEMS[idx];
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  ctx.fillRect(0, h * 0.38, w, h * 0.26);
  ctx.font = '600 17px "Google Sans Flex", sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(q.slice(0, Math.ceil(Math.min(1, p / 0.35) * q.length)), w / 2, h * 0.49);
  if (p > 0.5) {
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 20px "Google Sans Flex", sans-serif';
    ctx.fillText(`= ${a}`, w / 2, h * 0.59);
  }
  ctx.textAlign = 'start';
}

function text(ctx, w, h, t) {
  ctx.fillStyle = '#2a2723';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.05);
  const pw = w * 0.8;
  const ph = h * 0.86;
  ctx.fillStyle = '#e9e6df';
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  ctx.fillStyle = '#3d3a35';
  ctx.fillRect(-pw / 2 + 12, -ph / 2 + 14, pw * 0.5, 6);
  const lines = 14;
  const cur = Math.floor(t * 1.4) % lines;
  const prog = (t * 1.4) % 1;
  for (let i = 0; i < lines; i++) {
    const y = -ph / 2 + 34 + i * ((ph - 46) / lines);
    const lw = (pw - 24) * (0.6 + hash(i) * 0.4);
    if (i === cur) {
      ctx.fillStyle = 'rgba(245,200,66,0.6)';
      ctx.fillRect(-pw / 2 + 10, y - 3, lw * prog + 4, 9);
    }
    ctx.fillStyle = 'rgba(60,57,52,0.55)';
    ctx.fillRect(-pw / 2 + 12, y, lw, 3);
  }
  const py = -ph / 2 + 34 + cur * ((ph - 46) / lines);
  const px = -pw / 2 + 12 + (pw - 24) * (0.6 + hash(cur) * 0.4) * prog;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px, py + 4);
  ctx.lineTo(px + 50, py + 80);
  ctx.stroke();
  ctx.restore();
  hand(ctx, w * 0.82, h * 0.86, 26, 18, -0.6);
}

const PHRASES = ['Tum kosso asa?', 'Hanv borem asa.', 'Kitem khobor?', 'Dev borem korum.'];

function speech(ctx, w, h, t) {
  ctx.fillStyle = '#121826';
  ctx.fillRect(0, 0, w, h);
  const bars = 26;
  const bw = (w * 0.8) / bars;
  for (let i = 0; i < bars; i++) {
    const amp = 0.15 + 0.85 * Math.abs(Math.sin(t * 6 + i * 0.6) * Math.sin(t * 1.3 + i * 0.2));
    const bh = amp * h * 0.26;
    const mid = Math.abs(i - bars / 2) < 4;
    ctx.fillStyle = mid ? '#38bdf8' : 'rgba(148,163,184,0.7)';
    ctx.beginPath();
    ctx.roundRect(w * 0.1 + i * bw + 1, h * 0.42 - bh / 2, bw - 2, bh, 2);
    ctx.fill();
  }
  const idx = Math.floor(t / 2) % PHRASES.length;
  ctx.font = '500 14px "Google Sans Flex", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(PHRASES[idx], w / 2, h * 0.68);
  ctx.textAlign = 'start';
}

export const SCENES = { knife, flame, wok, lathe, wheel, solder, suture, stride, climb, water, drive, numbers, text, speech };

/** Shared colour grade so every loop reads as the same camera. */
export function grade(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(15,23,42,0.12)';
  ctx.fillRect(0, 0, w, h);
}
