import { AlertTriangle } from 'lucide-react';

const DOT_TONES = {
  cyan: 'bg-syn-cyan',
  red: 'bg-syn-red',
  amber: 'bg-syn-amber',
  ok: 'bg-syn-ok',
  muted: 'bg-syn-muted',
};

/** Square status LED with a hard (stepped, non-blurred) pulse. */
export function StatusDot({ tone = 'cyan', pulse = true, fast = false, className = '' }) {
  const anim = pulse ? (fast ? 'animate-pulse-fast' : 'animate-pulse-hard') : '';
  return (
    <span className={`relative inline-flex h-2 w-2 shrink-0 ${className}`} aria-hidden="true">
      <span className={`absolute inset-0 ${DOT_TONES[tone]} ${anim}`} />
      <span className={`absolute -inset-[3px] border ${tone === 'red' ? 'border-syn-red/40' : tone === 'amber' ? 'border-syn-amber/40' : 'border-syn-cyan/40'}`} />
    </span>
  );
}

const TAG_TONES = {
  cyan: 'border-syn-cyan/50 bg-syn-cyan/10 text-syn-cyan',
  amber: 'border-syn-amber/50 bg-syn-amber/10 text-syn-amber',
  red: 'border-syn-red/50 bg-syn-red/10 text-syn-red',
  muted: 'border-syn-hairline bg-syn-canvas text-syn-muted',
  ink: 'border-syn-frame bg-syn-canvas text-syn-ink',
};

export function Tag({ tone = 'muted', children, className = '' }) {
  return <span className={`tag ${TAG_TONES[tone]} ${className}`}>{children}</span>;
}

/** Section heading: index number + label + hairline rule. */
export function SectionLabel({ index, children, right }) {
  return (
    <div className="flex items-center gap-2">
      {index && <span className="t-label text-syn-cyan">{index}</span>}
      <span className="t-label text-syn-ink/80">{children}</span>
      <span className="h-px flex-1 bg-syn-hairline" />
      {right && <span className="t-label">{right}</span>}
    </div>
  );
}

const ALERT_TONES = {
  amber: { box: 'border-syn-amber/50 bg-syn-amber/[0.07]', text: 'text-syn-amber', hatch: 'bg-hatch-amber' },
  red: { box: 'border-syn-red/50 bg-syn-red/[0.07]', text: 'text-syn-red', hatch: 'bg-hatch-red' },
};

/** Translucent regulatory / warning box with a hazard-hatched leading edge. */
export function AlertBox({ tone = 'amber', title, icon: Icon = AlertTriangle, children }) {
  const t = ALERT_TONES[tone];
  return (
    <div role="alert" className={`relative flex overflow-hidden rounded-sm border ${t.box}`}>
      <div className={`w-1.5 shrink-0 ${t.hatch}`} />
      <div className="flex gap-2.5 p-3">
        <Icon className={`mt-px h-4 w-4 shrink-0 ${t.text}`} strokeWidth={2} />
        <div className="min-w-0 space-y-1.5">
          {title && (
            <p className={`font-mono text-[11px] font-bold uppercase tracking-instrument ${t.text}`}>{title}</p>
          )}
          <div className="font-mono text-[11px] leading-relaxed text-syn-ink/80">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Corner registration marks for an instrument frame. */
export function CornerMarks({ tone = 'border-syn-frame' }) {
  const base = `pointer-events-none absolute h-2 w-2 ${tone}`;
  return (
    <>
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </>
  );
}
