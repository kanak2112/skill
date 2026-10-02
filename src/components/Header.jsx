import Icon from './Icon.jsx';
import { useSystemClock } from '../hooks/useSystemClock.js';

const STATUS_META = {
  active: { label: 'Patch connected', dot: 'bg-accent', pulse: true },
  terminated: { label: 'Patch idle', dot: 'bg-muted', pulse: false },
  complete: { label: 'Patch idle', dot: 'bg-muted', pulse: false },
};

function StatusRow() {
  const clock = useSystemClock();
  return (
    <div className="flex items-center justify-between px-5 pb-2 pt-3 text-[12px] text-muted">
      <span className="font-medium tabular-nums text-ink">{clock}</span>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Icon name="wifi" size={16} />
          <span className="tabular-nums">100%</span>
          <span className="sr-only">connection</span>
        </span>
        <span className="flex items-center gap-1">
          <Icon name="battery_5_bar" size={16} className="rotate-90" />
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
      <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-1.5">
        <h1 className="text-header text-ink">Neural Skill Stream</h1>
        <span className="flex items-center gap-2 text-caption text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.pulse ? 'animate-breathe' : ''}`} aria-hidden="true" />
          {meta.label}
        </span>
      </div>
    </header>
  );
}
