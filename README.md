# Neural Skill Stream

Interactive design-fiction prototype for a BCI skill-rental platform. React (Vite), Tailwind CSS,
lucide-react, set entirely in Google Sans Flex. All people and licence numbers are fictional.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Artefacts

**01 · Cylindrical skill vault** (`src/frames/MarketplaceFrame.jsx`)
- CSS-3D inner-cylinder carousel: 8 tiles per ring, tiles tilt ±15° as they curve away.
- Horizontal drag rotates 360° (infinite, with momentum + snap). Vertical swipe moves between
  domains — Culinary, Craft, Physical, Cognitive (infinite). Trackpad/wheel and arrow keys also work.
- Provenance filter (All / Personal / Composite / Synthetic) dims non-matching tiles and rotates to
  the nearest match.
- Tile treatments: **Personal** — cyan badge, gold verified crest, expert signature watermark.
  **Composite** — stacked layers + node-network overlay. **Synthetic** — rotating wireframe shimmer
  border, wireframe grid, "No single human owner" tag.
- Tap any tile to lock it to centre and open the full-height skill sheet (`SkillSheet.jsx`):
  preview controls, provenance copy, rating/rentals/queue, live EEG/EMG compatibility, expert or
  model verification + CDSCO licence, hourly and per-minute pricing, max continuous rental per 24h
  rest window (longer durations disabled), refund terms, disclosure accordions, and a waiting-list
  simulation before "Rent & stream now".

**02 · Neural & haptic wearable** (`src/frames/ActiveSessionFrame.jsx`)
- Live motor-profile banner, countdown, motor frequency and skin-contact impedance readings.
- Anomaly detector (`useAnomaly.js`): fires ~8 s into a stream and every 35 s, or on demand via
  "Simulate anomaly" under the device; auto-stabilises over 6 s.
- Patch illustration (`Wearable.jsx`) with segmented LED ring — cyan active, amber drift, red
  decoherence — and a touch kill-switch: press and hold 1.5 s. "Stop Session" uses a confirm sheet.

**03 · Post-rental diagnostic** (`src/frames/DiagnosticFrame.jsx`)
- Performance vs. retention split, residual artifacts, unassisted competency regression, JSON export.

## Footage

Tiles play procedural canvas loops (`src/footage/scenes.js`, one shared 30 fps ticker) standing in
for first-person video. To use real clips, add muted MP4s to `public/footage/` and set
`video: '/footage/<file>.mp4'` on a model in `src/data/catalog.js`; the tile switches to `<video>`.

## Structure

| Path | Purpose |
| --- | --- |
| `src/theme/tokens.js` | Color + font tokens consumed by Tailwind |
| `src/data/catalog.js` | Domains, provenance types, 16 models |
| `src/hooks/useCylinder.js` | Rotation / row physics, gestures, wheel, snapping |
| `src/components/VaultTile.jsx`, `ModelVisuals.jsx` | Tile + provenance visual language |
| `src/hooks/useSessionTimer.js` | Session lifecycle, kept in `App` across frame switches |
