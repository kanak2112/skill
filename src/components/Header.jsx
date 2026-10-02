import { BatteryFull, Signal, Wifi } from 'lucide-react';
import { useSystemClock } from '../hooks/useSystemClock.js';
import { StatusDot } from './ui.jsx';

function StatusBar() {
  const clock = useSystemClock();
  return (
    <div className="flex items-center justify-between border-b border-syn-hairline px-4 py-2">
      <span className="t-data text-[11px] font-semibold tracking-instrument text-syn-ink">
        {clock} <span className="text-syn-muted">IST</span>
      </span>
      <div className="flex items-center gap-3 text-syn-muted">
        <span className="t-data text-[10px] tracking-instrument">
          LINK: <span className="text-syn-cyan">100%</span>
        </span>
        <Signal className="h-3.5 w-3.5" strokeWidth={2} aria-label="Network signal" />
        <Wifi className="h-3.5 w-3.5" strokeWidth={2} aria-label="Wireless link" />
        <span className="flex items-center gap-1">
          <BatteryFull className="h-4 w-4 text-syn-ink" strokeWidth={1.75} aria-label="Battery" />
          <span className="t-data text-[10px] text-syn-ink">87</span>
        </span>
      </div>
    </div>
  );
}

export default function Header() {
  return (
    <header className="shrink-0 border-b border-syn-hairline bg-syn-canvas">
      <StatusBar />
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="font-sans text-[17px] font-extrabold leading-none tracking-badge text-syn-ink">
            SYNAPTEK
          </h1>
          <p className="mt-1.5 truncate font-mono text-[9px] font-semibold uppercase leading-none tracking-brand text-syn-cyan">
            BCI Skill Streaming Node
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-sm border border-syn-cyan/40 bg-syn-cyan/[0.06] px-2.5 py-1.5">
          <StatusDot tone="cyan" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-instrument text-syn-cyan">
            Node 8.1 Active
          </span>
        </div>
      </div>
    </header>
  );
}
