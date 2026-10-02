# Neural Skill Stream: design system & motion handoff

Source of truth: `src/theme/tokens.js`. Run `npm run tokens` to regenerate
`tokens/design-tokens.json` (W3C Design Tokens format). Import that file into Figma
Variables with Tokens Studio, or map it by hand using the tables below. Every value here
is the one the live prototype runs on.

---

## 1. Colour primitives

| Token | Hex | Role | Contrast on base | Contrast on surface |
| --- | --- | --- | --- | --- |
| `color/canvas` | `#090D14` | Base background (single app surface) | n/a | n/a |
| `color/surface` | `#131924` | Card surface: search bar, sheets, footage backing | n/a | n/a |
| `color/line` | `#222A38` | 1px dividers between sections | n/a | n/a |
| `color/ink` | `#F1F5F9` | Primary text, titles, metrics | 17.8 : 1 | 16.1 : 1 |
| `color/muted` | `#8E9BAE` | Muted labels, captions, metadata | 6.9 : 1 | 6.2 : 1 |
| `color/accent` | `#E2B168` | Primary accent (warm brass): primary buttons, selected tab | 9.9 : 1 | 9.0 : 1 |
| `color/teal` | `#5BBFBA` | Connection status: patch connected, skill active, time bar | 8.9 : 1 | 8.1 : 1 |
| `color/amber` | `#F2A65A` | Warning: unusual signals, ring pulsing | 9.6 : 1 | 8.7 : 1 |
| `color/alert` | `#E06D53` | Alert / loss (soft coral): hold-to-stop, −14% loss | 6.0 : 1 | 5.4 : 1 |

Primary button: `#0F172A` text on `#E2B168` gives 9.1 : 1. All text pairs pass WCAG AA (4.5 : 1).

**Colour rules.** Brass means "you can act here". Teal means "connected". Amber means
"watch this". Coral means "stop or lost". No colour has a second meaning.

---

## 2. Typography (Google Sans Flex only)

Hierarchy comes from size, weight (`wght`), optical size (`opsz`) and width (`wdth`).
No other families are used. Icons are Material Symbols Outlined at `wght 300`.

| Role | Size / line | `wght` | `opsz` | Other | Used for |
| --- | --- | --- | --- | --- | --- |
| Screen title | 20 / 24px | 500 | 24 | tracking −0.015em | App bar, sheet title, active skill name |
| Card title | 15 / 19.5px | 500 | auto (15) | tracking −0.01em | List rows, queue card, alert titles (carousel card names use 13px at the same weight) |
| Section label | 13 / 17px | 500 | auto | sentence case | "Time left", "After-effects" |
| Body & descriptions | 14 / 21.7px | 400 | 14 | n/a | Paragraphs, bullets |
| Precision numerics | 28px (up to 56px for the timer) | 400 (300 at 44px+) | 28 | `wdth 75`, `tnum` | 99.2%, 59:57, 14h, ₹1,850 |
| Caption | 12 / 16.8px | 400 | auto | `#8E9BAE` | Metadata, hints |
| Badge | 11px | 500 | auto | full pill | Human expert, Composite, Synthetic model |

CSS: `.type-screen { font-variation-settings: 'opsz' 24 }` and
`.metric { font-variation-settings: 'opsz' 28, 'wdth' 75; font-feature-settings: 'tnum' 1 }`.

---

## 3. Corner radius scale

| Token | Value | Applies to |
| --- | --- | --- |
| `radius/container` | 16px | Overlay sheets, modals, device frame |
| `radius/control` | 8px | Cards (including carousel cards), search bar, primary and secondary buttons, alerts |
| `radius/pill` | 100px | Status indicators, badges, suggestion chips, prototype nav |

No other radii are used.

---

## 4. Motion

### 4.1 Spring (shared)

`stiffness 300 · damping 25 · mass 1` (damping ratio ≈ 0.72: a short, weighty settle
with a slight overshoot).

- **Figma Smart Animate:** Spring, Custom, *Stiffness 300, Damping 25, Mass 1*.
- **ProtoPie:** Spring, *Tension 300, Friction 25*.
- **Code:** `src/motion/spring.js`, a fixed-step (1/240 s) semi-implicit Euler integrator.

### 4.2 Cylindrical carousel (`src/hooks/useCylinder.js`)

| Phase | Behaviour |
| --- | --- |
| Drag | Rotation follows the finger 1 : 1 (one slot per card width plus gap). The axis locks after 6px of movement. |
| Release | The fling velocity seeds the spring. The target is the nearest slot to *current + velocity × 160ms*, so a hard flick travels further and lands with weight. |
| Vertical swipe | The same spring, moving to the next or previous skill area (at most ±1 per flick). |
| Catch | Touching the cylinder mid-spin stops it dead (velocity zeroed). |
| Tap a card | It springs to the centre, then the sheet opens after 380ms. |
| Depth | Centre: scale 1.0, opacity 1, sharp. Neighbours (±45°): scale 0.85, `rotateY ±18°`, opacity 0.65. Further cards and other rows: footage blurs to 6px and labels fade out. |
| Reduced motion | Snaps to the target with no spring. |

### 4.3 Hold-to-stop ring (`src/components/Wearable.jsx`)

| t (s) | Event | Visual | Haptic (`navigator.vibrate`, ms) |
| --- | --- | --- | --- |
| 0.0 | Press | Countdown "3". The ring starts filling clockwise from 12 o'clock. | `[12]` |
| 0.0–3.0 | Holding | The fill follows elapsed time through the spring (smooth ease-out). The colour blends teal → coral. Third markers light up as they are passed. | n/a |
| 1.0 / 2.0 | Count changes to 2, then 1 | The numeral updates | `[18]` each |
| 3.0 | Complete | The label reads "Disconnecting…" | `[30, 40, 70]` |
| 3.0–4.1 | Release | The ring drains over 1.1s, then the skill disconnects | n/a |
| Any time before 3.0 | Let go | The ring springs back to empty | `[8]` |

The vibration API works on Android browsers. iOS Safari ignores it, so native builds
should map these patterns to `UIImpactFeedbackGenerator` (light, light, heavy).

### 4.4 Detail sheet (`src/components/SkillSheet.jsx`)

| Property | Enter | Exit |
| --- | --- | --- |
| Sheet transform | `translateY(+100%)` → `0` | `0` → `+100%` |
| Duration | 420ms | 315ms |
| Easing | `cubic-bezier(0.32, 0.72, 0, 1)` | same |
| Backdrop | Fades in: `#090D14` at 55% with `backdrop-filter: blur(16px)` | Fades out |

---

## 5. Component checklist

- **App bar:** a single row with the screen title (20/500/opsz 24) and teal patch status on the left, and time, connection and battery in captions on the right.
- **Search bar:** surface fill, 1px `line` border, 8px radius, muted `search` and `mic` symbols.
- **Suggestion chips:** full pill on surface. Active chips get a brass tint at 15%.
- **Filter tabs:** text only, with a 2px brass underline on the active tab.
- **Carousel card:** 8px radius, a sentence-case pill badge and a brass `verified` symbol for human experts.
- **Sections:** separated by 1px `line` dividers, with no nested card containers.
- **Primary button:** brass fill, `#0F172A` text, 8px radius, 44–48px tall.
