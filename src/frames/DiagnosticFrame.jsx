import { useState } from 'react';
import { Check, Hand, MessageSquareText, TrendingDown } from 'lucide-react';

const SESSION_ID = '88492';

const AFTER_EFFECTS = [
  { key: 'tremor', icon: Hand, title: 'Hand tremor (temporary)', note: 'Mild shaking when your hands are at rest', value: '14', unit: 'h' },
  { key: 'speech', icon: MessageSquareText, title: 'Speech habits (temporary)', note: "The expert's rhythm of speaking may linger", value: '+18', unit: 'h' },
];

function exportData(skill) {
  const payload = {
    sessionId: SESSION_ID,
    duration: '1h 00m',
    skill,
    howWellYouDid: 0.992,
    whatYouKept: 0.021,
    afterEffects: AFTER_EFFECTS.map(({ title, value, unit, note }) => ({ title, lasts: `${value}${unit}`, note })),
    naturalSkillLoss: -0.14,
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

function SplitBar({ label, hint, value, pct, tone, bar }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[14px] text-ink">{label}</p>
          <p className="text-[12px] text-muted">{hint}</p>
        </div>
        <span className={`text-[24px] font-semibold tracking-tight tabular-nums ${tone}`}>{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(pct, 1.5)}%` }} />
      </div>
    </div>
  );
}

/** Before → after bar where the lost share is drawn in place, so the drop reads at a glance. */
function LossBar() {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-right text-[12px] font-medium tabular-nums text-alert">−14% lost</p>
      <div className="relative h-3 rounded-full bg-canvas">
        <div className="absolute inset-y-0 left-0 w-[86%] rounded-l-full bg-muted/70" />
        <div
          className="absolute inset-y-0 right-0 w-[14%] rounded-r-full border border-alert/70"
          style={{
            background: 'repeating-linear-gradient(-45deg, rgba(239,68,68,0.55) 0 3px, rgba(239,68,68,0.18) 3px 6px)',
          }}
        />
        <div className="absolute -top-1 bottom-[-4px] left-[86%] w-0.5 -translate-x-1/2 rounded-full bg-alert" />
      </div>
      <div className="mt-2 flex justify-between text-[12px]">
        <span className="font-medium text-ink">
          Now <span className="tabular-nums">86%</span>
        </span>
        <span className="text-muted">
          Before <span className="tabular-nums">100%</span>
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="h-2.5 w-4 rounded-sm bg-muted/70" /> What you can still do alone
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span
            className="h-2.5 w-4 rounded-sm border border-alert/70"
            style={{ background: 'repeating-linear-gradient(-45deg, rgba(239,68,68,0.55) 0 2px, rgba(239,68,68,0.18) 2px 4px)' }}
          />
          Lost for now
        </span>
      </div>
    </div>
  );
}

export default function DiagnosticFrame({ session, onDone }) {
  const [exported, setExported] = useState(false);
  const { model } = session;
  const skill = model.expert ? `${model.expert} — ${model.title.replace(/ v\d.*$/, '')}` : model.title;

  const handleExport = () => {
    exportData(skill);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="space-y-5 p-5">
      <header>
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Session summary</h2>
        <p className="mt-1 text-[14px] text-muted">{skill}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          <span className="tabular-nums">1</span>h <span className="tabular-nums">00</span>m · Session {SESSION_ID}
        </p>
      </header>

      <section className="card space-y-5 p-5">
        <h3 className="text-[15px] font-medium text-ink">How it went</h3>
        <SplitBar label="How well you did" hint="With the skill running" value="99.2%" pct={99.2} tone="text-ink" bar="bg-accent" />
        <SplitBar label="What you kept" hint="Learned for yourself" value="2.1%" pct={2.1} tone="text-warning" bar="bg-warning" />
      </section>

      <section>
        <h3 className="mb-2 text-[14px] font-medium text-muted">After-effects</h3>
        <ul className="card divide-y divide-line px-5">
          {AFTER_EFFECTS.map((t) => {
            const Icon = t.icon;
            return (
              <li key={t.key} className="flex items-center gap-3 py-4">
                <Icon className="h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-ink">{t.title}</p>
                  <p className="text-[13px] text-muted">{t.note}</p>
                </div>
                <span className="shrink-0 text-[17px] font-semibold text-warning">
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
            <h3 className="text-[15px] font-medium text-ink">Natural skill loss</h3>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
              Relying on rented skills makes you a little worse at doing it on your own, for a while.
            </p>
          </div>
          <span className="text-[24px] font-semibold tracking-tight tabular-nums text-alert">-14%</span>
        </div>
        <LossBar />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleExport} className="btn-secondary h-12">
          {exported && <Check className="h-4 w-4 text-accent" strokeWidth={2.5} />}
          {exported ? 'Exported' : 'Export data'}
        </button>
        <button onClick={onDone} className="btn-primary h-12">
          Done
        </button>
      </div>
    </div>
  );
}
