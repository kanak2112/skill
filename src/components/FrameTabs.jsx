// Prototype navigation — sits outside the device and is not part of the app UI.
export const FRAMES = [
  { id: 'market', label: 'Skill vault' },
  { id: 'session', label: 'Wearable' },
  { id: 'report', label: 'Report' },
];

export default function FrameTabs({ active, onChange }) {
  return (
    <nav className="inline-flex rounded-full border border-line p-0.5" role="tablist" aria-label="Prototype screens">
      {FRAMES.map((f) => {
        const on = active === f.id;
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(f.id)}
            className={`h-7 rounded-full px-3.5 text-[12px] transition-colors ${on ? 'bg-surface text-ink' : 'text-muted hover:text-ink'}`}
          >
            {f.label}
          </button>
        );
      })}
    </nav>
  );
}
