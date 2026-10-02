import { useState } from 'react';
import { Brain, Check, Download, FileText, MessageSquareText, TrendingDown, X } from 'lucide-react';
import { CornerMarks, SectionLabel, Tag } from '../components/ui.jsx';

const SESSION_ID = '#SYN-88492';
const DURATION = '1H 00M';

const KPIS = [
  {
    key: 'proficiency',
    value: '99.2%',
    label: 'Task Proficiency',
    verdict: 'Flawless Execution',
    border: 'border-syn-cyan',
    text: 'text-syn-cyan',
    fill: 0.992,
    bar: 'bg-syn-cyan',
  },
  {
    key: 'retention',
    value: '2.1%',
    label: 'Skill Retention',
    verdict: 'Negligible Encoding',
    border: 'border-syn-amber',
    text: 'text-syn-amber',
    fill: 0.021,
    bar: 'bg-syn-amber',
  },
];

const DECAY_LOG = [
  {
    key: 'motor',
    icon: Brain,
    title: 'Motor Pattern Drift',
    value: '14 HRS',
    tone: 'amber',
    note: 'Mild resting hand tremor detected post-session.',
  },
  {
    key: 'behavioral',
    icon: MessageSquareText,
    title: 'Behavioral Trace',
    value: '+18 HRS',
    tone: 'amber',
    note: 'Source expert phrase cadence & speech tone persisted.',
  },
  {
    key: 'regression',
    icon: TrendingDown,
    title: 'Unassisted Skill Regression',
    value: '-14%',
    tone: 'red',
    note: 'Baseline unassisted competency decay due to rental reliance.',
  },
];

const TONE_TEXT = { amber: 'text-syn-amber', red: 'text-syn-red' };
const TONE_RAIL = { amber: 'bg-syn-amber', red: 'bg-syn-red' };

function exportTelemetry() {
  const payload = {
    node: 'SYNAPTEK BCI SKILL STREAMING NODE 8.1',
    sessionId: SESSION_ID,
    duration: DURATION,
    patchId: '#T3-99',
    license: 'CDSCO Class-III #SYN-2035',
    profile: 'Chef Arjun Mehra — Culinary Knife Techniques v2.1 (#0092-P)',
    kpis: { taskProficiency: 0.992, skillRetention: 0.021 },
    telemetry: { synapticLoadPct: 78, motorCortexOutputHz: 120, hapticImpedanceOhm: 12 },
    decayLog: DECAY_LOG.map(({ title, value, note }) => ({ title, value, note })),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `synaptek-telemetry-${SESSION_ID.replace('#', '')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function KpiCard({ kpi }) {
  return (
    <div className={`relative rounded-sm border ${kpi.border} bg-syn-surface p-3`}>
      <CornerMarks tone={kpi.border} />
      <p className={`t-data text-[30px] font-bold leading-none tracking-tight ${kpi.text}`}>{kpi.value}</p>
      <div className="mt-3 h-[3px] w-full bg-syn-canvas">
        <div className={`h-full ${kpi.bar}`} style={{ width: `${Math.max(kpi.fill * 100, 2)}%` }} />
      </div>
      <p className="mt-3 font-mono text-[10px] font-bold uppercase leading-tight tracking-instrument text-syn-ink">{kpi.label}</p>
      <p className={`mt-1.5 font-mono text-[9px] uppercase leading-tight tracking-wide ${kpi.text}`}>{kpi.verdict}</p>
    </div>
  );
}

export default function DiagnosticFrame({ onClose }) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    exportTelemetry();
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Diagnostic header */}
      <header className="rounded-sm border border-syn-hairline bg-syn-surface">
        <div className="flex items-center justify-between border-b border-syn-hairline px-3 py-2">
          <Tag tone="ink">
            <FileText className="h-2.5 w-2.5" strokeWidth={2.5} />
            Post-Session
          </Tag>
          <span className="t-data text-[10px] tracking-instrument text-syn-muted">REV 03 · SIGNED</span>
        </div>
        <div className="px-3 py-3">
          <h2 className="font-sans text-[16px] font-bold uppercase leading-tight tracking-wide text-syn-ink">
            Session Diagnostic &amp; Telemetry
          </h2>
          <p className="t-data mt-2 text-[10px] uppercase tracking-instrument text-syn-muted">
            Session ID: <span className="text-syn-ink">{SESSION_ID}</span> • Duration:{' '}
            <span className="text-syn-ink">{DURATION}</span>
          </p>
        </div>
      </header>

      {/* KPI dual cards */}
      <div className="grid grid-cols-2 gap-3">
        {KPIS.map((k) => (
          <KpiCard key={k.key} kpi={k} />
        ))}
      </div>

      {/* Neural trace & decay log */}
      <section className="space-y-2">
        <SectionLabel index="L" right={`${DECAY_LOG.length} ENTRIES`}>
          Neural Trace &amp; Decay Log
        </SectionLabel>
        <ol className="divide-y divide-syn-hairline rounded-sm border border-syn-hairline bg-syn-surface">
          {DECAY_LOG.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.key} className="relative flex gap-3 py-3 pl-4 pr-3">
                <span className={`absolute inset-y-0 left-0 w-[2px] ${TONE_RAIL[item.tone]}`} />
                <span className="t-data pt-0.5 text-[10px] text-syn-muted">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-syn-ink">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-syn-muted" strokeWidth={2} />
                      {item.title}
                    </span>
                    <span className={`t-data shrink-0 text-[13px] font-bold ${TONE_TEXT[item.tone]}`}>{item.value}</span>
                  </div>
                  <p className="mt-1.5 font-sans text-[12px] italic leading-snug text-syn-muted">{item.note}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Regulatory footnote */}
      <p className="border-l border-syn-frame pl-3 font-mono text-[10px] leading-relaxed text-syn-muted">
        Telemetry logged under CDSCO Class-III license #SYN-2035. Data synced to Composite Synthetic Training Set.
      </p>

      {/* Action bar */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleExport} className="btn-ghost h-12">
          {exported ? <Check className="h-4 w-4 text-syn-ok" strokeWidth={2.5} /> : <Download className="h-4 w-4" strokeWidth={2.25} />}
          {exported ? 'Exported' : 'Export Telemetry'}
        </button>
        <button onClick={onClose} className="btn-cyan h-12">
          <X className="h-4 w-4" strokeWidth={2.5} />
          Close Report
        </button>
      </div>
    </div>
  );
}
