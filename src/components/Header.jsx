import Icon from './Icon.jsx';
import { useSystemClock } from '../hooks/useSystemClock.js';

const STATUS_META = {
  active: { label: 'Patch connected', icon: 'sensors', tone: 'text-teal' },
  terminated: { label: 'Patch idle', icon: 'sensors_off', tone: 'text-muted' },
  complete: { label: 'Patch idle', icon: 'sensors_off', tone: 'text-muted' },
};

/** One compact bar: app name + patch connection on the left, device status on the right. */
export default function Header({ sessionStatus }) {
  const clock = useSystemClock();
  const meta = STATUS_META[sessionStatus];
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3">
      <div className="min-w-0">
        <h1 className="text-app text-ink">Neural Skill Stream</h1>
        <p className={`mt-0.5 flex items-center gap-1 text-caption ${meta.tone}`}>
          <Icon name={meta.icon} size={14} />
          {meta.label}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-caption text-muted">
        <span className="tabular-nums text-ink">{clock}</span>
        <span className="flex items-center gap-0.5">
          <Icon name="wifi" size={14} />
          <span className="sr-only">Connection</span>
          <span className="tabular-nums">100%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <Icon name="battery_5_bar" size={14} className="rotate-90" />
          <span className="sr-only">Patch battery</span>
          <span className="tabular-nums">87%</span>
        </span>
      </div>
    </header>
  );
}
