import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Clock,
  FileText,
  LifeBuoy,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  ShieldAlert,
  Star,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import Footage from './Footage.jsx';
import { NodeNetwork, NoOwnerTag, ShimmerBorder, SignatureWatermark, TypeBadge, VerifiedCrest, Wireframe } from './ModelVisuals.jsx';
import { MODEL_TYPES, formatWait, inr } from '../data/catalog.js';
import { DURATIONS } from '../hooks/useSessionTimer.js';

const DISCLOSURES = [
  {
    id: 'terms',
    icon: FileText,
    label: 'Rental Terms & Conditions',
    body: 'Rentals grant temporary, non-transferable motor and cognitive overlay rights. Output produced while streaming may not be resold as original work. Source creators retain all model rights.',
  },
  {
    id: 'refund',
    icon: ReceiptText,
    label: 'Refund Policy',
    body: null, // filled from model.refundTerms
  },
  {
    id: 'safety',
    icon: ShieldAlert,
    label: 'Safety & Neural Overload Disclosures',
    body: 'Do not operate vehicles or machinery outside the licensed skill domain while streaming. Residual motor and behavioural traces may persist up to 18 hours. Stop immediately if you experience vertigo, aphasia or loss of proprioception.',
  },
];

function Section({ title, children }) {
  return (
    <section className="border-t border-line pt-5">
      <h3 className="mb-3 text-[13px] font-medium text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-[14px] text-muted">{label}</span>
      <span className="text-right text-[14px] font-medium text-ink">{children}</span>
    </div>
  );
}

function Preview({ model }) {
  const [paused, setPaused] = useState(false);
  const [take, setTake] = useState(0);

  const frame = (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[11px] bg-canvas">
      <Footage key={take} scene={model.scene} variant={model.variant} src={model.video} paused={paused} className="absolute inset-0" />
      {model.type === 'composite' && <NodeNetwork className="absolute inset-0 h-full w-full" />}
      {model.type === 'synthetic' && <Wireframe className="absolute inset-0 h-full w-full" />}
      {model.type === 'personal' && <SignatureWatermark name={model.expert} className="absolute bottom-12 right-3 scale-125 origin-bottom-right" />}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-canvas/90 to-transparent p-3 pt-8">
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/15 text-ink backdrop-blur-sm hover:bg-ink/25"
          aria-label={paused ? 'Play preview' : 'Pause preview'}
        >
          {paused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
        </button>
        <button
          onClick={() => {
            setTake((n) => n + 1);
            setPaused(false);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/15 text-ink backdrop-blur-sm hover:bg-ink/25"
          aria-label="Restart preview"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-canvas/60 px-2.5 py-1 text-[11px] text-muted backdrop-blur-sm">
          <VolumeX className="h-3 w-3" /> Muted · First-person loop
        </span>
      </div>
    </div>
  );

  if (model.type === 'synthetic') return <ShimmerBorder>{frame}</ShimmerBorder>;
  return <div className={`rounded-xl border ${model.type === 'personal' ? 'border-cyan/40' : 'border-accent/40'}`}>{frame}</div>;
}

function Compatibility({ match }) {
  const [live, setLive] = useState({ eeg: match + 0.6, emg: match - 0.8 });
  useEffect(() => {
    const id = setInterval(() => {
      setLive({
        eeg: Math.min(99.9, match + 0.6 + (Math.random() - 0.5) * 0.6),
        emg: Math.min(99.9, match - 0.8 + (Math.random() - 0.5) * 0.6),
      });
    }, 1000);
    return () => clearInterval(id);
  }, [match]);

  return (
    <div className="card p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[30px] font-semibold leading-none tracking-tight tabular-nums text-ink">{match.toFixed(1)}%</p>
          <p className="mt-1.5 text-[13px] text-muted">Synaptic compatibility</p>
        </div>
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-accent" /> Live from patch
        </span>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full bg-accent" style={{ width: `${match}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
        <div className="flex justify-between">
          <span className="text-muted">EEG match</span>
          <span className="tabular-nums text-ink">{live.eeg.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">EMG match</span>
          <span className="tabular-nums text-ink">{live.emg.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function Provenance({ model }) {
  if (model.type === 'personal') {
    const initials = model.expert
      .replace(/^(Chef|Dr\.|Adv\.)\s+/, '')
      .split(' ')
      .map((p) => p[0])
      .join('');
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-[14px] font-semibold text-cyan">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
              {model.expert} <VerifiedCrest className="h-4 w-4" />
            </p>
            <p className="text-[13px] text-muted">{model.creatorLevel}</p>
          </div>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink/80">{model.bio}</p>
        <div className="mt-2 divide-y divide-line">
          <Row label="Source">1 identifiable expert</Row>
          <Row label="Verified creator">
            <span className="text-gold">Gold verified</span>
          </Row>
          <Row label="CDSCO licence">
            Class-III · Active <span className="block text-[12px] font-normal text-muted">#{model.licence}</span>
          </Row>
        </div>
      </>
    );
  }
  return (
    <>
      <p className="text-[14px] leading-relaxed text-ink/80">{model.bio}</p>
      <div className="mt-2 divide-y divide-line">
        {model.type === 'composite' ? (
          <>
            <Row label="Trained on">{model.trainedOn}</Row>
            <Row label="Contributors">Consented &amp; verified</Row>
          </>
        ) : (
          <>
            <Row label="Model origin">{model.creatorLevel}</Row>
            <Row label="Human owner">None</Row>
          </>
        )}
        <Row label="CDSCO licence">
          Class-III · Active <span className="block text-[12px] font-normal text-muted">#{model.licence}</span>
        </Row>
      </div>
    </>
  );
}

function Disclosures({ model }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="card divide-y divide-line">
      {DISCLOSURES.map((d) => {
        const Icon = d.icon;
        const isOpen = open === d.id;
        return (
          <div key={d.id}>
            <button
              onClick={() => setOpen(isOpen ? null : d.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted" />
              <span className="flex-1 text-[14px] text-ink">{d.label}</span>
              <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pl-11 text-[13px] leading-relaxed text-muted">
                {d.body ?? (
                  <ul className="list-disc space-y-1 pl-4">
                    {model.refundTerms.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
      <a href="mailto:support@example.com" className="flex items-center gap-3 px-4 py-3.5 text-[14px] text-accent">
        <LifeBuoy className="h-4 w-4 shrink-0" /> Contact customer support
      </a>
    </div>
  );
}

function useQueue(waitMins) {
  // Simulated waiting list: joining places you at position 3 and advances
  // one place every 2 s so the prototype reaches "ready" quickly.
  const [queue, setQueue] = useState(waitMins ? 'idle' : 'ready');
  const [position, setPosition] = useState(3);
  useEffect(() => {
    if (queue !== 'queued') return undefined;
    const id = setInterval(() => {
      setPosition((p) => {
        if (p <= 1) {
          setQueue('ready');
          return 0;
        }
        return p - 1;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [queue]);
  return {
    queue,
    position,
    join: () => {
      setPosition(3);
      setQueue('queued');
    },
    leave: () => setQueue('idle'),
  };
}

export default function SkillSheet({ model, onClose, onRent }) {
  const [shown, setShown] = useState(false);
  const [duration, setDuration] = useState('1h');
  const { queue, position, join, leave } = useQueue(model.waitMins);
  const closeRef = useRef(null);
  const type = MODEL_TYPES[model.type];
  const total = model.hourly * DURATIONS[duration].multiplier;

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    closeRef.current?.focus();
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    setShown(false);
    setTimeout(onClose, 260);
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute inset-0 z-40">
      <div
        className={`absolute inset-0 bg-canvas/70 transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className={`absolute inset-x-0 bottom-0 top-3 flex flex-col overflow-hidden rounded-t-2xl border-t border-line bg-canvas transition-transform duration-300 ease-out ${
          shown ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3">
          <span className="w-8" />
          <span className="h-1 w-10 rounded-full bg-line" aria-hidden="true" />
          <button ref={closeRef} onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted hover:text-ink" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 pb-6">
          <Preview model={model} />

          {/* Title & provenance */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={model.type} label={`${type.label} model`} size="md" />
              <span className="text-[12px] text-muted">{type.paradigm}</span>
              {model.type === 'synthetic' && <NoOwnerTag />}
            </div>
            <h2 id="sheet-title" className="mt-3 text-[22px] font-semibold leading-tight tracking-tight text-ink">
              {model.title}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {model.type === 'personal' && (
                <>
                  Captured from 1 identifiable expert — <span className="text-ink">{model.expert}</span>.
                </>
              )}
              {model.type === 'composite' && (
                <>
                  Generated by combining patterns from verified practitioners — trained on{' '}
                  <span className="text-ink">{model.trainedOn}</span>.
                </>
              )}
              {model.type === 'synthetic' && type.copy}
            </p>
          </div>

          {/* Ratings & queue */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="flex items-center gap-1 text-[17px] font-semibold text-ink">
                {model.rating} <Star className="h-3.5 w-3.5 fill-warning text-warning" strokeWidth={0} aria-label="stars" />
              </p>
              <p className="mt-0.5 text-[12px] text-muted">Rating</p>
            </div>
            <div>
              <p className="text-[17px] font-semibold text-ink">{model.rentals}</p>
              <p className="mt-0.5 text-[12px] text-muted">Total rentals</p>
            </div>
            <div>
              <p className={`flex items-center gap-1.5 text-[14px] font-semibold leading-tight ${model.waitMins ? 'text-warning' : 'text-accent'}`}>
                {model.waitMins ? <Clock className="h-3.5 w-3.5 shrink-0" /> : <Zap className="h-3.5 w-3.5 shrink-0" />}
                {model.waitMins ? formatWait(model.waitMins).replace('Waiting list: ', '') : 'Immediate'}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">{model.waitMins ? 'Waiting list' : 'Stream'}</p>
            </div>
          </div>

          <Section title="Neural profile compatibility">
            <Compatibility match={model.match} />
          </Section>

          <Section title={model.type === 'personal' ? 'Expert profile & verification' : 'Model provenance & verification'}>
            <Provenance model={model} />
          </Section>

          <Section title="Pricing & rental allowance">
            <div className="divide-y divide-line">
              <Row label="Hourly rate">
                <span className="tabular-nums">{inr(model.hourly)}</span>/hr
              </Row>
              <Row label="Per minute">
                <span className="tabular-nums">{inr(model.hourly / 60, 2)}</span>/min
              </Row>
              <Row label="Max continuous rental">
                <span className="tabular-nums">{model.maxHours}</span>h per 24h neural rest window
              </Row>
            </div>
            <p className="mb-2 mt-4 text-[13px] text-muted">Duration</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface p-1" role="radiogroup" aria-label="Duration">
              {Object.values(DURATIONS).map((d) => {
                const on = duration === d.label;
                const blocked = d.seconds / 3600 > model.maxHours;
                return (
                  <button
                    key={d.label}
                    role="radio"
                    aria-checked={on}
                    disabled={blocked}
                    onClick={() => setDuration(d.label)}
                    className={`h-9 rounded-md text-[14px] font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:text-muted/40 disabled:line-through ${
                      on ? 'bg-canvas text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <ul className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-muted">
              {model.refundTerms.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {t}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Support & disclaimers">
            <Disclosures model={model} />
          </Section>
        </div>

        {/* Sticky action */}
        <div className="shrink-0 border-t border-line bg-canvas px-5 pb-5 pt-3">
          {queue === 'queued' ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[14px] font-medium text-warning">In queue · position {position}</p>
                <p className="text-[12px] text-muted">We'll hold your slot for 2 minutes when it opens.</p>
              </div>
              <button onClick={leave} className="btn-secondary h-11">
                Leave queue
              </button>
            </div>
          ) : queue === 'idle' ? (
            <button onClick={join} className="btn h-12 w-full border border-warning/60 text-warning hover:bg-warning/10">
              <Clock className="h-4 w-4" /> Join waiting list · {formatWait(model.waitMins).replace('Waiting list: ', '')}
            </button>
          ) : (
            <>
              {model.waitMins > 0 && <p className="mb-2 text-center text-[12px] text-accent">Your slot is ready.</p>}
              <button onClick={() => onRent(duration, model)} className="btn-primary h-12 w-full">
                Rent &amp; stream now — <span className="tabular-nums">{inr(total)}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
