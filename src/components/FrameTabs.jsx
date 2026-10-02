// Prototype navigation — sits outside the device and is not part of the app UI.
export const FRAMES = [
  { id: 'market', label: 'Skill vault' },
  { id: 'session', label: 'Wearable' },
  { id: 'report', label: 'Report' },
];

export default function FrameTabs({ active, onChange }) {
  return (
    <nav className="mx-auto flex w-full max-w-[420px] border-b border-line" role="tablist" aria-label="Prototype screens">
      {FRAMES.map((f, i) => {
        const on = active === f.id;
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(f.id)}
            className={`relative flex-1 px-3 pb-2.5 pt-1.5 text-[13px] font-medium transition-colors ${on ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            <span className="mr-1.5 tabular-nums text-muted">{i + 1}</span>
            {f.label}
            <span className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full ${on ? 'bg-accent' : 'bg-transparent'}`} />
          </button>
        );
      })}
    </nav>
  );
}
