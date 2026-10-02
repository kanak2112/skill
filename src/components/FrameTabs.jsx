import { StatusDot } from './ui.jsx';

export const FRAMES = [
  { id: 'market', index: '01', label: 'Storefront' },
  { id: 'session', index: '02', label: 'Session HUD' },
  { id: 'report', index: '03', label: 'Diagnostic' },
];

export default function FrameTabs({ active, onChange, sessionStatus }) {
  return (
    <nav className="grid shrink-0 grid-cols-3 border-b border-syn-hairline bg-syn-canvas" role="tablist" aria-label="Frames">
      {FRAMES.map((f, i) => {
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.id)}
            className={`relative flex flex-col items-start gap-1 px-3 py-2.5 text-left transition-colors ${
              i > 0 ? 'border-l border-syn-hairline' : ''
            } ${isActive ? 'bg-syn-surface' : 'hover:bg-syn-surface/50'}`}
          >
            <span className="flex w-full items-center justify-between">
              <span className={`t-data text-[10px] font-bold tracking-instrument ${isActive ? 'text-syn-cyan' : 'text-syn-muted'}`}>
                FRAME {f.index}
              </span>
              {f.id === 'session' && sessionStatus === 'active' && <StatusDot tone="red" fast />}
            </span>
            <span className={`font-mono text-[10px] uppercase leading-none tracking-wide ${isActive ? 'text-syn-ink' : 'text-syn-muted'}`}>
              {f.label}
            </span>
            <span className={`absolute inset-x-0 bottom-0 h-[2px] ${isActive ? 'bg-syn-cyan' : 'bg-transparent'}`} />
          </button>
        );
      })}
    </nav>
  );
}
