import { useState } from 'react';
import { Check } from 'lucide-react';

const SESSION_ID = 'SYN-88492';

const METRICS = [
  { key: 'execution', value: '99.2%', label: 'Task Execution', tone: 'text-ink' },
  { key: 'retention', value: '2.1%', label: 'Skill Retention', tone: 'text-warning' },
];

const SIDE_EFFECTS = [
  {
    key: 'motor',
    title: 'Motor Drift',
    value: '14',
    suffix: 'hrs remaining',
    tone: 'text-warning',
    note: 'Mild hand tremor detected post-session.',
  },
  {
    key: 'behavioral',
    title: 'Behavioral Trace',
    value: '18',
    suffix: 'hrs remaining',
    tone: 'text-warning',
    note: 'Source speech tone & cadence persisted.',
  },
  {
    key: 'regression',
    title: 'Unassisted Skill Regression',
    value: '-14%',
    tone: 'text-alert',
    note: 'Temporary decay in unassisted baseline performance.',
  },
];

function exportData() {
  const payload = {
    sessionId: SESSION_ID,
    duration: '1h 00m',
    skill: 'Chef Arjun Mehra — Culinary Knife Techniques',
    metrics: { taskExecution: 0.992, skillRetention: 0.021 },
    sideEffects: SIDE_EFFECTS.map(({ title, value, suffix, note }) => ({
      title,
      value: suffix ? `${value} ${suffix}` : value,
      note,
    })),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${SESSION_ID}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DiagnosticFrame({ onDone }) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    exportData();
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="space-y-5 p-5">
      <header>
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Session Diagnostic</h2>
        <p className="mt-1 text-[14px] text-muted">
          Duration: <span className="tabular-nums">1</span>h <span className="tabular-nums">00</span>m
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((m) => (
          <div key={m.key} className="card p-4">
            <p className={`text-[30px] font-semibold leading-none tracking-tight tabular-nums ${m.tone}`}>{m.value}</p>
            <p className="mt-2 text-[13px] text-muted">{m.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-2 text-[14px] font-medium text-muted">Side effects &amp; decay</h3>
        <ul className="card divide-y divide-line px-5">
          {SIDE_EFFECTS.map((s) => (
            <li key={s.key} className="py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-medium text-ink">{s.title}</span>
                <span className="shrink-0 text-[14px]">
                  <span className={`font-semibold tabular-nums ${s.tone}`}>{s.value}</span>
                  {s.suffix && <span className="ml-1 text-muted">{s.suffix}</span>}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleExport} className="btn-secondary h-12">
          {exported && <Check className="h-4 w-4 text-accent" strokeWidth={2.5} />}
          {exported ? 'Exported' : 'Export Data'}
        </button>
        <button onClick={onDone} className="btn-primary h-12">
          Done
        </button>
      </div>
    </div>
  );
}
