# Neural Skill Stream

Interactive design-fiction prototype for a BCI skill-rental platform. React (Vite) and Tailwind CSS,
set entirely in Google Sans Flex with Material Symbols Outlined icons (weight 300). Low-chroma dark
palette with strict colour roles: brass (#E2B168) for primary actions and selection, teal (#5BBFBA)
for connection status, amber (#F2A65A) for warnings, coral (#E06D53) for disconnect and loss.
Radii: 16px containers, 8px cards / inputs / buttons, full pills for badges. All people and licence
numbers are fictional.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Neural Stream™ DS-28 storefront & Web Manual (`/ds28/`)

A second page in the same Vite project (`ds28/index.html` → `src/ds28/`). Open
http://localhost:5173/ds28/ with `npm run dev`. Plain CSS (`src/ds28/ds28.css`), React state only, no backend.

**Storefront**
- **Overview**: "Wear Your Motor Intent." hero, feature cards, skill stream preview.
- **Shape Studio** (`pages/Studio.jsx`): three generation inputs.
  - *Voice Prompt*: Web Speech API where available, simulated dictation otherwise. `parsePrompt()` in
    `shapes.js` maps keywords to form, finish and coating (e.g. "crimson anger … glossy" → Anger Glyph,
    Electro-Chromic Red, Glossy metallic).
  - *Sketch Canvas*: freehand strokes are normalised and smoothed into a wire-form shell; nine vector primitives.
  - *Image Reference*: uploads are traced to a 40 × 40 silhouette and snapped to the nearest finish colour.
  - Four finishes (#ff2a4b, #00f0ff, #ffb703, #334155) × three coatings, rendered with an SVG specular bevel.
  - Try-on silhouette with Temple (0.82 kΩ), Cervical (1.14 kΩ) and Forearm (0.45 kΩ) nodes; the patch
    moves, scales and rotates to the selected node, with an optional close-up.
- **Cart & Sync**: $280 core + $60 shell = $340. *Confirm Order* issues a serial such as `DS28-ANG-301`
  and stores the profile (localStorage, when available), which unlocks the Web Manual.

**Web Manual** (`manual/`), themed from the shell finish via `--acc`:
01 shell configurator (Active Load Glow / Stealth Mode) · 02 hold-to-calibrate ring · 03 stream rental
(price and cooldown = hours × override × 1.5, min 1 h; locked until calibrated) · 04 live topology
inspector with bond-site re-assignment · 05 safety disclaimers and the DRM lockout overlay.

## Design system

Tokens, type roles, radius scale and motion specs (springs, hold-to-stop timeline, sheet
transition, haptics) are documented in [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). `npm run tokens`
exports `src/theme/tokens.js` to `tokens/design-tokens.json` for Figma Variables.

## Artefacts

**01 · Cylindrical skill vault** (`src/frames/MarketplaceFrame.jsx`)
- CSS-3D inner-cylinder carousel: 8 tiles per ring, tiles tilt ±15° as they curve away.
- Horizontal drag rotates 360° (infinite, with momentum + snap). Vertical swipe moves between
  domains — Culinary, Craft, Physical, Cognitive (infinite). Trackpad/wheel and arrow keys also work.
- Search bar ("Search skills, tasks, or experts...") with simulated voice input and suggestion tags;
  results dim non-matches and bring the nearest match forward, across skill areas.
- Filter tabs (All / Human experts / Composite / Synthetic) work the same way.
- Depth: centre card 100%; neighbours 85% scale, 18° Y rotation, 65% opacity; cards further round
  and other skill areas go out of focus: footage blurs (drawn in canvas) and labels fade out.
  Neighbours keep playing at a slower speed.
- Tile treatments: **Personal** — cyan badge, gold verified crest, expert signature watermark.
  **Composite** — stacked layers + node-network overlay. **Synthetic** — rotating wireframe shimmer
  border, wireframe grid, "No single human owner" tag.
- Tap any tile to lock it to centre and open the rental sheet directly (`SkillSheet.jsx`): preview, verified
  badge, three key numbers (rating, fit, price), plain-English after-effects, and a collapsed
  "More details" section (expert, fit breakdown, pricing and daily limit, refunds, terms, safety).
  Waiting-list models show a pulsing queue card that counts down before "Rent for ₹…".

**02 · Neural & haptic wearable** (`src/frames/ActiveSessionFrame.jsx`)
- Live motor-profile banner, countdown, motor frequency and skin-contact impedance readings.
- Anomaly detector (`useAnomaly.js`): fires ~8 s into a stream and every 35 s, or on demand via
  "Simulate anomaly" under the device; auto-stabilises over 6 s.
- Movement signal and skin contact readings jitter live with sparklines.
- Patch (`Wearable.jsx`): thin 2px status ring (brass active, coral warning, grey disconnected)
  around the only stop control. Hold for a 3-2-1 countdown while the ring fills and shifts from
  brass to coral; it then drains before the skill disconnects.

**03 · Post-rental diagnostic** (`src/frames/DiagnosticFrame.jsx`)
- How well you did vs. what you kept, after-effects, and natural skill loss with the lost 14% drawn
  on the bar. JSON export (works locally; the hosted artifact viewer blocks downloads).

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
