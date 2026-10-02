# SYNAPTEK // BCI Skill Streaming Node

Interactive 3-frame prototype for a 2035 Brain-Computer Interface skill-rental terminal.
Built with React (Vite), Tailwind CSS and lucide-react.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/theme/tokens.js` | Design tokens (colors, fonts, tracking) — consumed by `tailwind.config.js` as `syn-*` utilities |
| `src/index.css` | CSS-variable mirror of tokens + component classes (`.t-label`, `.panel`, `.tag`, `.btn-*`) |
| `src/components/Header.jsx` | Status bar (live clock from 09:41:00 IST), brand badge, node pill |
| `src/components/FrameTabs.jsx` | Frame 01/02/03 selector |
| `src/components/ui.jsx` | StatusDot, Tag, SectionLabel, AlertBox, CornerMarks |
| `src/frames/MarketplaceFrame.jsx` | Frame 01 — search, tier filter, featured + composite models, CDSCO notice |
| `src/frames/ActiveSessionFrame.jsx` | Frame 02 — live countdown, telemetry, drift warning, emergency decoherence modal |
| `src/frames/DiagnosticFrame.jsx` | Frame 03 — KPIs, decay log, JSON telemetry export |
| `src/hooks/useSessionTimer.js` | Session lifecycle (`active` / `terminated` / `complete`), kept in `App` so the countdown survives tab switches |

## Interactions

- Search and tier tabs filter the asset index (Synthetic shows an empty state).
- Duration selector (15M / 1H / 4H) reprices the CTA; renting starts a fresh session and opens Frame 02.
- Frame 02 boots mid-stream at 42:19 of a 1H session (bar = time remaining, ~70%).
- Emergency Decoherence opens a confirm dialog (Esc / Cancel / Stop Now); stopping halts the stream and links to the report.
- Export Telemetry downloads the session report as JSON.
