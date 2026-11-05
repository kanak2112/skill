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

## Knack: standalone design-fiction prototype (`standalone/Knack.html`)

Knack is a skin patch, set in 2035, that lets you rent an expert's hand skills by the hour. It's
a single self-contained HTML file built on the original diagnostic manual (same Tailwind CDN, React
UMD + in-browser Babel and Lucide setup). Open it directly in a browser. Every date it shows comes
from an in-world clock: today's date and time, moved to 2035.

- **Home:** full-screen 3D head (Three.js r147, orbit controls, slow auto-turn; still for people who
  ask for reduced motion) with “Get yours now”, which fades into the Shape Studio.
- **Shape Studio:** describe, pick or draw a shell; colour and finish update live on the model. The
  shell has a printed side wall and a contact shadow on the skin. Descriptions with no shape, colour
  or finish in them still land on the closest printable shell. “Upload your photo” first shows how
  the face scan is used (with an optional, unticked partner-sharing offer), then projects the
  portrait onto the model's face; the photo is never saved. Forearm zooms out to a raised forearm.
- **Checkout:** Indian delivery address, standard or next-day drone drop, UPI / e₹ / card, all in ₹.
- **Web Manual, before delivery:** Order Tracking, Where to Wear It and Safety are open, and Your
  Sessions lets you start a skill wishlist in the vault.
- **After delivery, a guided journey:** 1 pair (tap a phone on the box, or type the patch ID),
  prepare skin and calibrate → 2 your data: where the online profile came from (phone check, ABHA
  health record, smart ring, employer wellness programme), who sees each, and what switching one off
  changes → 3 pick first-month skills in the cylindrical skill vault (the main prototype's
  `MarketplaceFrame`, bundled from `standalone/vault-entry.jsx` with the manual's colours and icons)
  → 4 personalised plan → 5 pay, which needs the risks acknowledged first → 6–8 Where to Wear It,
  Safety, Hardware (each skippable).
- **For experts:** Chef Arjun Mehra's side of the same skill. He applies and is checked, agrees the
  split (30% to him) and clause 14.2 (his recordings can be combined into composite skills), records
  six months of service with two patches, has his worst hours removed in review, publishes, and
  watches his earnings: where his hands are streaming now, and the composite built partly from his
  hours overtaking him. A stream of his skill from this browser's own order pings his dashboard.
- **Your Sessions** runs the paid plan. After every session a full-screen debrief plays out: the
  expert's hands leaving yours, a counter and curve falling to the share of the skill that stays, how
  closely you matched the expert, how your own unassisted steadiness has moved, and a paid retention
  licence for what stays. “See the last debrief again” replays it.

**Presenting:** press `P` (or open with `?present`) to hide the prototype controls. Shortcuts:
`D` next delivery step (places a demo order first if there is none, ends by pairing), `F` end the
running session and then skip the rest, `R` twice to start over, `?` to list them. Outside
presenter mode the dashed prototype bar has the same controls plus “Start over”.

The head scan (“Lee Perry-Smith”, Infinite-Realities, CC BY 3.0) and its textures are embedded as
base64. `standalone/manual-app.jsx` is the readable source of the file's app script. After editing
it, `vault-entry.jsx` or the vault styles, run `node standalone/build.mjs` to rebuild `Knack.html`.
