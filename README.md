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

## Neural Stream™ DS-28 (`/ds28/`)

A second page in the same Vite project (`ds28/index.html` → `src/ds28/`). Open
http://localhost:5173/ds28/ with `npm run dev`. React, plain CSS (`src/ds28/ds28.css`) and Lucide icons;
no backend. `npm test` runs the Vitest suite for pricing, persona, prompt-parsing and tracing logic.

**Mode 1 · Landing** (`pages/Landing.jsx`, `components/Head3D.jsx`): a procedural wireframe head on
canvas (deformed sphere with brow, eye sockets, nose, lips, chin, ears and a neck, lit per vertex)
rotates continuously and can be dragged. The temple patch is a DOM overlay turned with CSS 3D
transforms to match the surface normal; it morphs (Anger Glyph → Volt Bolt → Teardrop → Hex Mesh, each
with its own colour) while hidden behind the head on every turn. "GET YOURS NOW" plays a zoom and
wipe into the purchase flow.

**Mode 2 · Purchase flow** (three steps in the top bar)
1. **Persona & skills** (`pages/Profiler.jsx`, `persona.js`): the user types a handle or short bio;
   an on-device keyword profiler (no network) returns a primary / secondary archetype and six trait
   scores. The marketplace offers each skill as a rental ($/hr, 1–8 prepaid hours) or monthly
   subscription (Craftsman $48 / $199, Surgeon $120 / $499, Heavy $250 / $899). The evolution
   preview tweens a radar chart from baseline to boosted traits and names the new persona.
2. **Shape Studio**: voice prompt (quick tags such as "A glossy crimson anger glyph"), sketch canvas
   and image trace; four finishes × three coatings; try-on on the Temple, Cervical and Forearm nodes.
3. **Checkout**: Core Unit $280 + Bespoke Shell $60 + skill plan. "Confirm & Bond Shell" issues an ID
   such as `DS28-ANG-241` and unlocks the Web Manual.

**Mode 3 · Web Manual** (`manual/`), themed from the bonded finish via `--acc`: 01 glow / stealth
shell profile · 02 hold-to-calibrate ring · 03 rental / subscription switcher, 1–8 h session, live
pricing (subscription hours count against a 40 h monthly cap), and live stream and cooldown timers on
a demo clock (1× / 60× / 600×) that lock re-streaming until cleared · 04 topology inspector with
impedance, 28-channel electrode seating map, SNR and latency per node · 05 safety disclaimers and the
signal caching violation interlock.

Persona, plan, design and the order (with console settings) are saved to localStorage when it is
available.

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
