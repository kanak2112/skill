/**
 * Patch shell geometry. Every shape lives in a 100 × 100 viewBox and is either a filled
 * silhouette (`mode: 'fill'`) or a thick wire-form (`mode: 'stroke'`).
 */
import { FINISHES } from './data.js';

function starPath(points = 5, outer = 44, inner = 19) {
  const pts = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(52 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function polygonPath(sides, r, rot = 0) {
  const pts = [];
  for (let i = 0; i < sides; i += 1) {
    const a = ((Math.PI * 2) / sides) * i + rot;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

export const PRESETS = [
  {
    id: 'anger',
    name: 'Anger Glyph',
    code: 'ANG',
    mode: 'stroke',
    strokeWidth: 12,
    cap: 'butt',
    d: 'M40 12 Q38 38 12 40 M60 12 Q62 38 88 40 M12 60 Q38 62 40 88 M88 60 Q62 62 60 88',
  },
  { id: 'bolt', name: 'Volt Bolt', code: 'VLT', mode: 'fill', d: 'M58 6 L20 56 H46 L38 94 L80 40 H54 Z' },
  { id: 'hex', name: 'Hive Hex', code: 'HEX', mode: 'fill', d: polygonPath(6, 42, Math.PI / 6) },
  {
    id: 'tear',
    name: 'Tear Drop',
    code: 'TRS',
    mode: 'fill',
    d: 'M50 6 C50 6 82 44 82 63 A32 32 0 0 1 18 63 C18 44 50 6 50 6 Z',
  },
  { id: 'star', name: 'Nova Star', code: 'STR', mode: 'fill', d: starPath() },
  { id: 'chevron', name: 'Wing Chevron', code: 'CHV', mode: 'fill', d: 'M6 26 L50 56 L94 26 L94 50 L50 82 L6 50 Z' },
  {
    id: 'crescent',
    name: 'Lunar Crescent',
    code: 'LUN',
    mode: 'fill',
    d: 'M62 8 A42 42 0 1 0 92 70 A33 33 0 1 1 62 8 Z',
  },
  {
    id: 'heart',
    name: 'Pulse Heart',
    code: 'LUV',
    mode: 'fill',
    d: 'M50 88 C22 66 8 48 8 32 A21 21 0 0 1 50 24 A21 21 0 0 1 92 32 C92 48 78 66 50 88 Z',
  },
  { id: 'delta', name: 'Delta Blade', code: 'DLT', mode: 'fill', d: 'M50 6 L94 88 L50 70 L6 88 Z' },
];

export const presetShape = (id) => {
  const p = PRESETS.find((s) => s.id === id) ?? PRESETS[0];
  return { ...p, source: 'preset' };
};

/** Keyword → intent tables for the voice prompt parser. */
const SHAPE_WORDS = [
  ['anger', ['anger', 'angry', 'rage', 'fury', 'furious', 'vein', 'mad']],
  ['bolt', ['bolt', 'lightning', 'electric', 'volt', 'energy', 'spark', 'thunder']],
  ['hex', ['hex', 'hexagon', 'hive', 'honeycomb', 'cell']],
  ['tear', ['tear', 'teardrop', 'drop', 'sad', 'sorrow', 'grief']],
  ['star', ['star', 'nova', 'celebrity', 'shine']],
  ['chevron', ['chevron', 'wing', 'wings', 'rank', 'flight']],
  ['crescent', ['moon', 'crescent', 'lunar', 'night']],
  ['heart', ['heart', 'love', 'pulse', 'romance']],
  ['delta', ['delta', 'blade', 'arrow', 'triangle', 'spear']],
];
const COLOR_WORDS = [
  ['red', ['crimson', 'red', 'scarlet', 'blood', 'ruby']],
  ['cyan', ['cyan', 'blue', 'teal', 'aqua', 'ice', 'neon']],
  ['gold', ['gold', 'golden', 'amber', 'brass', 'yellow']],
  ['slate', ['slate', 'stealth', 'black', 'grey', 'gray', 'graphite', 'shadow']],
];
const COATING_WORDS = [
  ['gloss', ['glossy', 'gloss', 'metallic', 'chrome', 'mirror', 'polished', 'shiny']],
  ['matte', ['matte', 'flat', 'brushed', 'soft']],
  ['satin', ['satin', 'pearl', 'silk']],
];

function match(words, table) {
  for (const [id, keys] of table) {
    const hit = words.find((w) => keys.includes(w));
    if (hit) return { id, word: hit };
  }
  return null;
}

/** Parse a natural-language sculpt prompt into shape, colour and coating intents. */
export function parsePrompt(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const shape = match(words, SHAPE_WORDS);
  const color = match(words, COLOR_WORDS);
  const coating = match(words, COATING_WORDS);
  let presetId = shape?.id;
  if (!presetId) {
    // No recognised form: hash the prompt so the same words always sculpt the same shell.
    const h = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    presetId = PRESETS[h % PRESETS.length].id;
  }
  const tokens = [
    { kind: 'form', value: shape ? shape.word : 'inferred', resolved: presetShape(presetId).name },
    color && { kind: 'finish', value: color.word, resolved: FINISHES.find((f) => f.id === color.id).name },
    coating && { kind: 'coating', value: coating.word, resolved: coating.id },
    words.includes('sharp') && { kind: 'edge', value: 'sharp', resolved: 'butt caps, 0.2 mm chamfer' },
    words.includes('bevel') || words.includes('bevels')
      ? { kind: 'bevel', value: 'bevels', resolved: 'specular lift 4.0' }
      : null,
  ].filter(Boolean);
  return { presetId, finishId: color?.id, coating: coating?.id, tokens };
}

/** Freehand strokes (points in 0–100 pad space) → normalised, smoothed wire-form path. */
export function strokesToPath(strokes) {
  const all = strokes.flat();
  if (!all.length) return null;
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const s = 72 / Math.max(w, h, 1);
  const ox = 50 - (w * s) / 2;
  const oy = 50 - (h * s) / 2;
  const f = (p) => [(p[0] - minX) * s + ox, (p[1] - minY) * s + oy];
  const n = (v) => v.toFixed(1);

  return strokes
    .map((raw) => {
      const pts = raw.map(f);
      if (pts.length === 1) return `M${n(pts[0][0])} ${n(pts[0][1])} l0.1 0`;
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      for (let i = 1; i < pts.length - 1; i += 1) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += ` Q${n(pts[i][0])} ${n(pts[i][1])} ${n(mx)} ${n(my)}`;
      }
      const last = pts[pts.length - 1];
      return `${d} L${n(last[0])} ${n(last[1])}`;
    })
    .join(' ');
}

/**
 * Trace an image into a filled silhouette. `data` is RGBA for an n × n grid.
 * Foreground comes from alpha when the image has transparency, otherwise from
 * luminance distance to the averaged corner (background) colour.
 */
export function traceImage(data, n, threshold = 60) {
  const px = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]];
  const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let transparent = 0;
  for (let i = 0; i < n * n; i += 1) if (px(i)[3] < 200) transparent += 1;
  const useAlpha = transparent / (n * n) > 0.05;

  const corners = [0, n - 1, n * (n - 1), n * n - 1].map(px);
  const bg = corners.reduce((a, c) => [a[0] + c[0] / 4, a[1] + c[1] / 4, a[2] + c[2] / 4], [0, 0, 0]);
  const dist = (c) => Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2]);

  const mask = new Array(n * n);
  let count = 0;
  const sum = [0, 0, 0];
  for (let i = 0; i < n * n; i += 1) {
    const c = px(i);
    const on = useAlpha ? c[3] > 128 : dist(c) > threshold * 1.6 || Math.abs(lum(c) - lum(bg)) > threshold;
    mask[i] = on;
    if (on) {
      count += 1;
      sum[0] += c[0];
      sum[1] += c[1];
      sum[2] += c[2];
    }
  }
  const coverage = count / (n * n);
  if (count < 4 || coverage > 0.97) return { d: null, coverage, finishId: null };

  let minX = n, minY = n, maxX = 0, maxY = 0;
  for (let y = 0; y < n; y += 1)
    for (let x = 0; x < n; x += 1)
      if (mask[y * n + x]) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const s = 80 / Math.max(bw, bh);
  const ox = 50 - (bw * s) / 2;
  const oy = 50 - (bh * s) / 2;

  let d = '';
  for (let y = minY; y <= maxY; y += 1) {
    let x = minX;
    while (x <= maxX) {
      if (!mask[y * n + x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x <= maxX && mask[y * n + x]) x += 1;
      // Small overlap hides anti-aliasing seams between rows.
      d += `M${(ox + (start - minX) * s).toFixed(2)} ${(oy + (y - minY) * s).toFixed(2)}h${((x - start) * s + 0.2).toFixed(2)}v${(s + 0.2).toFixed(2)}h${(-(x - start) * s - 0.2).toFixed(2)}Z`;
    }
  }

  const avg = sum.map((v) => v / count);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const finishId = FINISHES.map((f) => [f.id, Math.hypot(...rgb(f.hex).map((v, i) => v - avg[i]))]).sort(
    (a, b) => a[1] - b[1],
  )[0][0];

  return { d, coverage, finishId };
}

/** Hardware serial: DS28-<shape code>-<3 digits>. */
export function makeSerial(code) {
  return `DS28-${code}-${String(100 + Math.floor(Math.random() * 900))}`;
}
