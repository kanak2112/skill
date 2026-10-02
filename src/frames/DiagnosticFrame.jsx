import { useState } from 'react';
import { Check, MessageSquareText, Hand, TrendingDown } from 'lucide-react';

const SESSION_ID = '88492';

const TRACES = [
  {
    key: 'motor',
    icon: Hand,
    title: 'Motor pattern drift',
    value: '14',
    unit: 'h',
    note: 'Hand tremor expected',
  },
  {
    key: 'behavioral',
    icon: MessageSquareText,
    title: 'Behavioral trace',
    value: '+18',
    unit: 'h',
    note: 'Speech cadence persistence',
  },
];

function exportData(skill) {
  const payload = {
    sessionId: SESSION_ID,
    duration: '1h 00m',
    skill,
    performance: { taskProficiency: 0.992, skillRetention: 0.021 },
    residualArtifacts: TRACES.map(({ title, value, unit, note }) => ({ title, duration: `${value}${unit}`, note })),
    unassistedRegression: -0.14,
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

function SplitBar({ label, value, pct, tone, bar }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[14px] text-ink">{label}</span>
        <span className={`text-[22px] font-semibold tracking-tight tabular-nums ${tone}`}>{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(pct, 1.5)}%` }} />
      </div>
    </div>
  );
}

export default function DiagnosticFrame({ session, onDone }) {
  const [exported, setExported] = useState(false);
  const skill = session.model.profile;

  const handleExport = () => {
    exportData(skill);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="space-y-5 p-5">
      <header>
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Post-rental diagnostic</h2>
        <p className="mt-1 text-[14px] text-muted">{skill}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          Duration <span className="tabular-nums">1</span>h <span className="tabular-nums">00</span>m · Session{' '}
          {SESSION_ID}
        </p>
      </header>

      <section className="card space-y-5 p-5">
        <div>
          <h3 className="text-[14px] font-medium text-ink">Performance vs. retention</h3>
          <p className="mt-0.5 text-[13px] text-muted">How well you performed, and how much of it stayed with you.</p>
        </div>
        <SplitBar label="Task proficiency" value="99.2%" pct={99.2} tone="text-ink" bar="bg-accent" />
        <SplitBar label="Skill retention" value="2.1%" pct={2.1} tone="text-warning" bar="bg-warning" />
      </section>

      <section>
        <h3 className="mb-2 text-[14px] font-medium text-muted">Behavioral traces &amp; residual artifacts</h3>
        <ul className="card divide-y divide-line px-5">
          {TRACES.map((t) => {
            const Icon = t.icon;
            return (
              <li key={t.key} className="flex items-center gap-3 py-4">
                <Icon className="h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-ink">{t.title}</p>
                  <p className="text-[13px] text-muted">{t.note}</p>
                </div>
                <span className="text-[17px] font-semibold text-warning">
                  <span className="tabular-nums">{t.value}</span>
                  {t.unit}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5">
        <div className="flex items-start gap-3">
          <TrendingDown className="mt-1 h-4 w-4 shrink-0 text-alert" />
          <div className="flex-1">
            <h3 className="text-[15px] font-medium text-ink">Unassisted competency regression</h3>
            <p className="mt-0.5 text-[13px] text-muted">Temporary loss of natural ability from reliance on rented skills.</p>
          </div>
          <span className="text-[22px] font-semibold tracking-tight tabular-nums text-alert">-14%</span>
        </div>
        <div className="mt-4 space-y-1.5 text-[12px] text-muted">
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0">Before</span>
            <div className="h-1.5 flex-1 rounded-full bg-muted/40" />
            <span className="w-9 text-right tabular-nums">100%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0">After</span>
            <div className="h-1.5 flex-1">
              <div className="h-full w-[86%] rounded-full bg-alert/80" />
            </div>
            <span className="w-9 text-right tabular-nums">86%</span>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-ink/80">-14% baseline unassisted proficiency</p>
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
