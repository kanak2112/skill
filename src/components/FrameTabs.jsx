// Prototype navigation — sits outside the device and is not part of the app UI.
export const FRAMES = [
  { id: 'market', label: 'Marketplace' },
  { id: 'session', label: 'Session' },
  { id: 'report', label: 'Diagnostic' },
];

export default function FrameTabs({ active, onChange }) {
  return (
    <nav
      className="mx-auto flex w-full max-w-[420px] gap-1 rounded-lg border border-line bg-surface/60 p-1"
      role="tablist"
      aria-label="Prototype frames"
    >
      {FRAMES.map((f, i) => {
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              isActive ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <span className="mr-1.5 text-muted">{i + 1}</span>
            {f.label}
          </button>
        );
      })}
    </nav>
  );
}
