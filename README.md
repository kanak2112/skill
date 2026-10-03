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

A second page in the same Vite project (`ds28/index.html` → `src/ds28/`). Run `npm run dev` and open
http://localhost:5173/ds28/. It uses the shared design system: `src/theme/tokens.js` through Tailwind,
`src/index.css` component classes (`btn-primary`, `tag`, `metric`), Google Sans Flex only, and
Material Symbols via `src/components/Icon.jsx`. Prices are in rupees with GST included.
`npm test` runs the Vitest suite.

**1 · Showcase** (`pages/Landing.jsx`, `components/HeadViewer.jsx`): a Three.js render of a scanned
head (“Lee Perry-Smith” by Infinite-Realities, CC BY 3.0, files in `public/ds28/head/`) with colour
and normal maps, physical skin material and a three-light studio rig. The shell is projected onto the
temple as a decal and changes design each time it turns out of view. Drag to turn. Falls back to a
flat shell image if WebGL is unavailable.

**2 · Purchase** (three steps)
1. **Design** — describe it (optional speech input), pick or draw it, or upload a picture to trace;
   choose colour and finish; try it on the temple, neck or forearm.
2. **Delivery** — name, mobile (+91), address, city, state and PIN with inline validation; standard
   (free, 5–7 days) or express (₹499, 2 days) with dates.
3. **Review & pay** — kit ₹44,900 + shell ₹4,000 + delivery. Choosing a payment method takes no
   payment details. Placing the order issues an order number and a hardware ID (`DS28-VLT-756`).

**3 · Web Manual** (`manual/`), built on the original diagnostic manual’s structure, in plain language:
00 Your order (tracking timeline, then unbox and pair by typing the hardware ID from the box) ·
01 Setup & calibration · 02 Skill rental · 03 Where to wear it (shows your shell) · 04 Safety ·
05 What’s inside (your shell is layer 01).

Hardware features are gated on order state: calibration and the copy-protection practice need a
paired patch; starting a stream needs pairing and calibration. Planning, reading and the placement
guide are available while the order is on its way. A “Next stage” prototype control advances the
delivery. Design, address and order (with pairing, calibration and any live stream) are saved to
localStorage when available.

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

## Standalone Web Manual (`standalone/Neural_Stream_Manual.html`)

A single self-contained HTML file built on the original diagnostic manual (same Tailwind CDN, React
UMD + in-browser Babel and Lucide setup). Open it directly in a browser.

- **Home:** full-screen 3D head (Three.js r147, orbit controls, slow auto-turn) with “Get yours now”,
  which fades into the Shape Studio.
- **Shape Studio:** describe, pick or draw a shell; colour and finish update live on the model.
  “Upload your photo” projects a portrait onto the model's face (front projection blended into the
  skin, with left/right, up/down and size controls); the photo stays in memory and is never saved.
  Choosing temple, neck or forearm moves the camera to frame that spot; forearm zooms out to a raised
  stand-in forearm model with the shell on its inner side.
- **Checkout:** Indian delivery address and shipping speed in ₹.
- **Web Manual, before delivery:** only Order Tracking, Where to Wear It and Safety are open.
- **After delivery, a guided journey:** 1 pair, prepare skin and calibrate → 2 pick first-month
  skills in the cylindrical skill vault (the main prototype's `MarketplaceFrame`, bundled from
  `standalone/vault-entry.jsx` and styled by a Tailwind build scoped to `#vault`) → 3 personalised
  plan per skill (session length from stamina and recovery, type-specific limits, placement and
  waiting-list notes, four-week schedule, bundle vs pay per session) → 4 pay → 5–7 Where to Wear
  It, Safety, Hardware (each skippable). Afterwards the manual opens on Your Sessions, which runs
  the paid plan. The profile starts from the buyer's online check and is replaced by the patch
  reading after calibration. Prototype controls can mark delivery, pair, finish setup and replay
  the journey.

The head scan (“Lee Perry-Smith”, Infinite-Realities, CC BY 3.0) and its textures are embedded as
base64. `standalone/manual-app.jsx` is the readable source of the file's app script.
