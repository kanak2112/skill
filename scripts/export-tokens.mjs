// Exports src/theme/tokens.js to tokens/design-tokens.json in the W3C Design Tokens
// (DTCG) format, importable into Figma Variables via Tokens Studio or similar.
// Run with: npm run tokens
import { writeFileSync } from 'node:fs';
import { axes, colors, fonts, motion, radii, type } from '../src/theme/tokens.js';

const px = (v) => ({ $type: 'dimension', $value: v });

const colorRoles = {
  canvas: 'Base background',
  surface: 'Card surface',
  line: 'Divider',
  ink: 'Primary text',
  muted: 'Muted label',
  accent: 'Primary accent (warm brass): primary actions, selected state',
  teal: 'Connection status',
  amber: 'Warning',
  alert: 'Alert / loss (soft coral)',
};

const out = {
  color: Object.fromEntries(
    Object.entries(colors).map(([k, v]) => [k, { $type: 'color', $value: v, $description: colorRoles[k] ?? '' }]),
  ),
  font: {
    family: { $type: 'fontFamily', $value: fonts.sans },
  },
  typography: Object.fromEntries(
    Object.entries(type).map(([k, [size, o]]) => [
      k,
      {
        $type: 'typography',
        $value: {
          fontFamily: 'Google Sans Flex',
          fontSize: size,
          fontWeight: Number(o.fontWeight),
          lineHeight: o.lineHeight,
          letterSpacing: o.letterSpacing ?? '0',
          ...(axes[k] ? { fontVariationSettings: axes[k] } : {}),
          ...(k === 'metric' ? { fontFeatureSettings: { tnum: 1 } } : {}),
        },
      },
    ]),
  ),
  radius: {
    container: { ...px(radii.container), $description: 'Overlay sheets, modals, device frame' },
    control: { ...px(radii.control), $description: 'Cards, search bar, primary buttons' },
    pill: { ...px('100px'), $description: 'Status indicators, badges (full pill)' },
  },
  motion: {
    spring: { $type: 'spring', $value: motion.spring, $description: 'Carousel rotation, row change, hold ring fill' },
    hold: {
      duration: { $type: 'duration', $value: `${motion.hold.durationMs}ms` },
      release: { $type: 'duration', $value: `${motion.hold.releaseMs}ms` },
    },
    sheet: {
      duration: { $type: 'duration', $value: `${motion.sheet.durationMs}ms` },
      easing: { $type: 'cubicBezier', $value: [0.32, 0.72, 0, 1] },
      enterOffsetY: { $type: 'dimension', $value: motion.sheet.enterY },
      backdropBlur: px(motion.sheet.backdropBlur),
    },
    haptics: Object.fromEntries(
      Object.entries(motion.haptics).map(([k, v]) => [k, { $type: 'vibrationPattern', $value: v, $description: 'navigator.vibrate pattern, ms' }]),
    ),
  },
};

writeFileSync(new URL('../tokens/design-tokens.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log('Wrote tokens/design-tokens.json');
