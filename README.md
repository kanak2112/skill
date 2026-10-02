# Neural Skill Stream

Interactive 3-frame prototype for a BCI skill-rental app. React (Vite), Tailwind CSS, lucide-react,
set entirely in Google Sans Flex.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/theme/tokens.js` | Color and font tokens, consumed by `tailwind.config.js` (`bg-canvas`, `bg-surface`, `border-line`, `text-muted`, `bg-accent`, …) |
| `src/index.css` | CSS-variable mirror of the tokens + `.card` and `.btn-*` component classes |
| `src/components/Header.jsx` | Status row (time, connection, patch battery), app title, patch status |
| `src/components/FrameTabs.jsx` | Prototype-only frame switcher, outside the device |
| `src/frames/MarketplaceFrame.jsx` | Frame 01 — search, category pills, primary skill card, secondary listing |
| `src/frames/ActiveSessionFrame.jsx` | Frame 02 — live countdown, vitals, residual notice, stop confirmation sheet |
| `src/frames/DiagnosticFrame.jsx` | Frame 03 — comparative metrics, side effects list, export |
| `src/hooks/useSessionTimer.js` | Session lifecycle, kept in `App` so the countdown survives frame switches |

Tabular figures (`tabular-nums`) are applied only to percentages, times and prices.

## Interactions

- Search and category pills filter listings; the duration picker reprices the CTA.
- Renting (either listing) starts a session and opens Frame 02.
- Frame 02 boots at 42:19 remaining of a 1h session and counts down.
- Stop Session → Confirm Disconnect? sheet (Esc / Cancel / Disconnect Now) → View Diagnostic.
- Export Data downloads the report as JSON; Done returns to the marketplace.
