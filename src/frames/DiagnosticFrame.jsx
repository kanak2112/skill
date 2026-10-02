import { useState } from 'react';
import Icon from '../components/Icon.jsx';

const SESSION_ID = '88492';

const AFTER_EFFECTS = [
  { key: 'tremor', icon: 'back_hand', title: 'Hand tremor (temporary)', note: 'Mild shaking when your hands are at rest', value: '14', unit: 'h' },
  { key: 'speech', icon: 'graphic_eq', title: 'Speech habits (temporary)', note: "The expert's rhythm of speaking may linger", value: '+18', unit: 'h' },
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

/** Single-line track indicator: hairline track, thin fill, end dot. */
function Track({ pct, tone = 'bg-accent' }) {
  return (
    <div className="relative mt-3 h-1.5">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
      <div className={`absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      <div
        className={`absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${tone}`}
        style={{ left: `${Math.max(pct, 0.8)}%` }}
      />
    </div>
  );
}

function Metric({ label, value, pct, tone }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] text-ink">{label}</p>
        <span className="metric text-ink">{value}</span>
      </div>
      <Track pct={pct} tone={tone} />
    </div>
  );
}

/** Natural skill loss: muted track with the lost 14% drawn as a soft coral delta line. */
function LossTrack() {
  return (
    <div className="mt-5">
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <div className="absolute left-0 top-1/2 h-0.5 w-[86%] -translate-y-1/2 rounded-full bg-muted/70" />
        {/* Delta: from 86% to where you were (100%) */}
        <div className="absolute left-[86%] right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-alert/80" />
        <div className="absolute left-[86%] top-0 h-4 w-px -translate-x-1/2 bg-alert" />
        <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full border border-muted bg-canvas" />
      </div>
      <div className="mt-2 flex justify-between text-caption text-muted">
        <span>
          Now <span className="tabular-nums text-ink">86%</span>
        </span>
        <span>
          Before <span className="tabular-nums">100%</span>
        </span>
      </div>
    </div>
  );
}

export default function DiagnosticFrame({ session, onDone }) {
  const [exported, setExported] = useState(false);
  const { model } = session;
  const skill = model.expert ? `${model.title.replace(/ v\d.*$/, '')} • ${model.expert}` : model.title;

  const handleExport = () => {
    exportData(skill);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="space-y-7 p-5">
      <section className="space-y-6">
        <p className="eyebrow">
          How it went · <span className="tabular-nums">1</span>h <span className="tabular-nums">00</span>m
        </p>
        <Metric label="Active performance" value="99.2%" pct={99.2} tone="bg-ink" />
        <Metric label="Skill retention" value="2.1%" pct={2.1} tone="bg-muted" />
      </section>

      <section className="border-t border-line pt-5">
        <p className="eyebrow">After-effects</p>
        <ul className="mt-1 divide-y divide-line">
          {AFTER_EFFECTS.map((t) => (
            <li key={t.key} className="flex items-center gap-3 py-4">
              <Icon name={t.icon} size={16} className="text-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-title text-ink">{t.title}</p>
                <p className="text-caption text-muted">{t.note}</p>
              </div>
              <span className="metric shrink-0 text-[22px] text-ink">
                {t.value}
                <span className="text-[14px] text-muted">{t.unit}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-title text-ink">Natural skill loss</p>
          <span className="metric shrink-0 text-ink">
            <span className="text-alert">−</span>14%
          </span>
        </div>
        <p className="mt-1 max-w-[30ch] text-caption leading-relaxed text-muted">
          Relying on rented skills makes you a little worse at doing it on your own, for a while.
        </p>
        <LossTrack />
      </section>

      <div className="grid grid-cols-2 gap-3 border-t border-line pt-5">
        <button onClick={handleExport} className="btn-secondary h-12">
          <Icon name={exported ? 'check' : 'download'} size={18} className={exported ? 'text-teal' : ''} />
          {exported ? 'Exported' : 'Export data'}
        </button>
        <button onClick={onDone} className="btn-primary h-12">
          Done
        </button>
      </div>
    </div>
  );
}
