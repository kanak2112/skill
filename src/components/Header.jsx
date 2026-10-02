import { BatteryMedium, Wifi } from 'lucide-react';
import { useSystemClock } from '../hooks/useSystemClock.js';

const STATUS_META = {
  active: { label: 'Patch connected', dot: 'bg-accent', pulse: true },
  terminated: { label: 'Patch idle', dot: 'bg-muted', pulse: false },
  complete: { label: 'Patch idle', dot: 'bg-muted', pulse: false },
};

function StatusRow() {
  const clock = useSystemClock();
  return (
    <div className="flex items-center justify-between px-5 pb-2 pt-3 text-[13px] text-muted">
      <span className="font-medium tabular-nums text-ink">{clock}</span>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Wifi className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          <span className="tabular-nums">100%</span>
          <span className="sr-only">connection</span>
        </span>
        <span className="flex items-center gap-1.5">
          <BatteryMedium className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          <span className="tabular-nums">87%</span>
          <span className="sr-only">patch battery</span>
        </span>
      </div>
    </div>
  );
}

export default function Header({ sessionStatus }) {
  const meta = STATUS_META[sessionStatus];
  return (
    <header className="shrink-0 border-b border-line">
      <StatusRow />
      <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-2">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">Neural Skill Stream</h1>
        <span className="flex items-center gap-2 text-[13px] text-muted">
          <span className={`h-2 w-2 rounded-full ${meta.dot} ${meta.pulse ? 'animate-breathe' : ''}`} aria-hidden="true" />
          {meta.label}
        </span>
      </div>
    </header>
  );
}
