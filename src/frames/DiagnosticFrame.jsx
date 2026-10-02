import { useState } from 'react';
import Icon from '../components/Icon.jsx';

const SESSION_ID = '88492';

const AFTER_EFFECTS = [
  { key: 'tremor', icon: 'vibration', title: 'Hand tremor (temporary)', note: 'Mild shaking when your hands are at rest', value: '14', unit: 'h' },
  { key: 'speech', icon: 'record_voice_over', title: 'Speech habits (temporary)', note: "The expert's rhythm of speaking may linger", value: '+18', unit: 'h' },
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

function Metric({ label, hint, value, pct, tone }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[14px] text-ink">{label}</p>
          <p className="text-caption text-muted">{hint}</p>
        </div>
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
    <div className="space-y-6 p-5">
      <section className="card space-y-6 p-5">
        <p className="eyebrow">
          How it went · <span className="tabular-nums">1</span>h <span className="tabular-nums">00</span>m
        </p>
        <Metric label="How well you did" hint="With the skill running" value="99.2%" pct={99.2} tone="bg-accent" />
        <Metric label="What you kept" hint="Learned for yourself" value="2.1%" pct={2.1} tone="bg-muted" />
      </section>

      <section>
        <p className="eyebrow mb-2">After-effects</p>
        <ul className="card divide-y divide-line px-5">
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

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-title text-ink">Natural skill loss</p>
            <p className="mt-1 text-caption leading-relaxed text-muted">
              Relying on rented skills makes you a little worse at doing it on your own, for a while.
            </p>
          </div>
          <span className="metric shrink-0 text-ink">
            <span className="text-alert">−</span>14%
          </span>
        </div>
        <LossTrack />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleExport} className="btn-secondary h-12">
          <Icon name={exported ? 'check' : 'download'} size={18} className={exported ? 'text-accent' : ''} />
          {exported ? 'Exported' : 'Export data'}
        </button>
        <button onClick={onDone} className="btn-primary h-12">
          Done
        </button>
      </div>
    </div>
  );
}
