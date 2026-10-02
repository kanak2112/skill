import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Footage from './Footage.jsx';
import { NodeNetwork, NoOwnerTag, ShimmerBorder, SignatureWatermark, TypeBadge, VerifiedCrest, Wireframe } from './ModelVisuals.jsx';
import { MODEL_TYPES, formatWait, inr } from '../data/catalog.js';
import { DURATIONS } from '../hooks/useSessionTimer.js';

const TERMS =
  'You get temporary use of the skill during your session. Work you produce while using it is yours, but the skill itself stays with its owner and cannot be resold or recorded.';
const SAFETY =
  "Don't drive or use heavy tools outside the skill you rented. After-effects can last up to 18 hours. Stop straight away if you feel dizzy, confused, or lose feeling in your hands.";

function Preview({ model }) {
  const [paused, setPaused] = useState(false);
  const [take, setTake] = useState(0);

  const frame = (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[11px] bg-canvas">
      <Footage key={take} scene={model.scene} variant={model.variant} src={model.video} paused={paused} className="absolute inset-0" />
      {model.type === 'composite' && <NodeNetwork className="absolute inset-0 h-full w-full" />}
      {model.type === 'synthetic' && <Wireframe className="absolute inset-0 h-full w-full" />}
      {model.type === 'personal' && (
        <SignatureWatermark name={model.expert} className="absolute bottom-12 right-3 origin-bottom-right scale-125" />
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-canvas/90 to-transparent p-3 pt-8">
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/15 text-ink backdrop-blur-sm hover:bg-ink/25"
          aria-label={paused ? 'Play preview' : 'Pause preview'}
        >
          <Icon name={paused ? 'play_arrow' : 'pause'} size={18} />
        </button>
        <button
          onClick={() => {
            setTake((n) => n + 1);
            setPaused(false);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/15 text-ink backdrop-blur-sm hover:bg-ink/25"
          aria-label="Restart preview"
        >
          <Icon name="replay" size={18} />
        </button>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-canvas/60 px-2.5 py-1 text-[11px] text-muted backdrop-blur-sm">
          <Icon name="volume_off" size={14} /> Muted preview
        </span>
      </div>
    </div>
  );

  if (model.type === 'synthetic') return <ShimmerBorder>{frame}</ShimmerBorder>;
  return <div className={`rounded-xl border ${model.type === 'personal' ? 'border-accent/30' : 'border-line'}`}>{frame}</div>;
}

function Spec({ value, label, children }) {
  return (
    <div className="min-w-0">
      <p className="metric flex items-center gap-1 text-ink">{value}{children}</p>
      <p className="mt-2 text-caption text-muted">{label}</p>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-[14px] text-muted">{label}</span>
      <span className="text-right text-[14px] text-ink">{children}</span>
    </div>
  );
}

function FitBreakdown({ match }) {
  const [live, setLive] = useState({ brain: match + 0.6, muscle: match - 0.8 });
  useEffect(() => {
    const id = setInterval(() => {
      setLive({
        brain: Math.min(99.9, match + 0.6 + (Math.random() - 0.5) * 0.6),
        muscle: Math.min(99.9, match - 0.8 + (Math.random() - 0.5) * 0.6),
      });
    }, 1000);
    return () => clearInterval(id);
  }, [match]);

  return (
    <div className="space-y-3">
      <p className="text-[13px] leading-relaxed text-muted">
        Measured live from your patch. Higher means the skill will feel more natural to you.
      </p>
      <div className="space-y-2.5">
        {[
          ['Brain signals', live.brain],
          ['Muscle signals', live.muscle],
        ].map(([label, v]) => (
          <div key={label}>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">{label}</span>
              <span className="tabular-nums text-ink">{v.toFixed(1)}%</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Fold({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-3.5 text-left">
        <span className="text-[14px] text-ink">{title}</span>
        <Icon name="expand_more" size={20} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function MoreDetails({ model }) {
  const isHuman = model.type === 'personal';
  return (
    <div className="card divide-y divide-line px-4">
      <Fold title={isHuman ? 'About the expert' : 'Where this skill comes from'}>
        <p className="text-[14px] leading-relaxed text-ink/80">{model.bio}</p>
        <div className="mt-2 divide-y divide-line">
          {isHuman && <Row label="Verification">{model.creatorLevel}</Row>}
          {model.type === 'composite' && <Row label="Learned from">{model.trainedOn}</Row>}
          {model.type === 'synthetic' && <Row label="Owner">No human owner</Row>}
          <Row label="Licence">
            CDSCO Class-III, active
            <span className="block text-[12px] text-muted">#{model.licence}</span>
          </Row>
        </div>
      </Fold>
      <Fold title="How the fit score works">
        <FitBreakdown match={model.match} />
      </Fold>
      <Fold title="Pricing & limits">
        <div className="divide-y divide-line">
          <Row label="Per hour">
            <span className="tabular-nums">{inr(model.hourly)}</span>
          </Row>
          <Row label="Per minute">
            <span className="tabular-nums">{inr(model.hourly / 60, 2)}</span>
          </Row>
          <Row label="Daily limit">
            Up to <span className="tabular-nums">{model.maxHours}</span> {model.maxHours === 1 ? 'hour' : 'hours'} a day
          </Row>
        </div>
      </Fold>
      <Fold title="Refund policy">
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-muted">
          {model.refundTerms.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" />
              {t}
            </li>
          ))}
        </ul>
      </Fold>
      <Fold title="Rental terms">
        <p className="text-[13px] leading-relaxed text-muted">{TERMS}</p>
      </Fold>
      <Fold title="Safety information">
        <p className="text-[13px] leading-relaxed text-muted">{SAFETY}</p>
      </Fold>
      <div className="py-3.5 text-[13px] text-muted">
        Need help? <span className="select-all text-ink">support@neuralskill.example</span>
      </div>
    </div>
  );
}

function useQueue(waitMins) {
  // Simulated waiting list: joining places you at position 3 and moves up one
  // place every 2 s so the prototype reaches "ready" quickly.
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
          <button
            ref={closeRef}
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted hover:text-ink"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-5 pb-6">
          <Preview model={model} />

          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {model.type === 'personal' ? (
                <span className="tag bg-accent/10 text-accent">
                  <VerifiedCrest size={14} /> Verified expert
                </span>
              ) : (
                <TypeBadge label={type.label} className="bg-surface" />
              )}
              {model.type === 'synthetic' && <NoOwnerTag />}
            </div>
            <h2 id="sheet-title" className="mt-3 text-[22px] font-medium leading-tight tracking-[-0.02em] text-ink">
              {model.title.replace(/ v\d.*$/, '')}
            </h2>
            <p className="mt-1.5 text-[14px] text-muted">
              {model.type === 'personal' ? `By ${model.expert}` : model.type === 'composite' ? `Learned from ${model.trainedOn}` : type.copy}
            </p>
          </div>

          {/* Three key numbers */}
          <div className="grid grid-cols-3 gap-4 border-y border-line py-4">
            <Spec value={model.rating} label={`Rating (${model.rentals})`}>
              <Icon name="star" fill size={18} className="text-accent" label="stars" />
            </Spec>
            <Spec value={<span className="tabular-nums">{Math.round(model.match)}%</span>} label="Fit for you" />
            <Spec value={<span className="tabular-nums">{inr(model.hourly)}</span>} label="Per hour" />
          </div>

          {/* Plain-English after-effects */}
          <section>
            <h3 className="eyebrow flex items-center gap-1.5">
              <Icon name="info" size={16} /> Good to know
            </h3>
            <ul className="mt-3 space-y-2.5">
              {type.afterEffects.map((t) => (
                <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-ink/85">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="eyebrow mb-2">More details</h3>
            <MoreDetails model={model} />
          </section>
        </div>

        {/* Action */}
        <div className="shrink-0 space-y-3 border-t border-line bg-canvas px-5 pb-5 pt-3">
          {queue === 'queued' ? (
            <div className="animate-queue-pulse rounded-xl border bg-accent/10 p-3.5" role="status" aria-live="polite">
              <div className="flex items-center gap-3">
                <span className="metric flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/60 text-accent">
                  {position}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-title text-ink">You're number {position} in line</p>
                  <p className="text-caption text-muted">We'll hold your spot for 2 minutes when it opens.</p>
                </div>
                <button onClick={leave} className="shrink-0 text-[13px] text-muted underline-offset-2 hover:text-ink hover:underline">
                  Leave
                </button>
              </div>
              <div className="mt-3 flex gap-1" aria-hidden="true">
                {[3, 2, 1].map((n) => (
                  <span key={n} className={`h-0.5 flex-1 rounded-full ${position < n ? 'bg-accent' : 'bg-line'}`} />
                ))}
              </div>
            </div>
          ) : queue === 'idle' ? (
            <button onClick={join} className="btn h-12 w-full border border-accent/50 text-accent hover:bg-accent/10">
              <Icon name="schedule" size={18} /> Join waiting list · {formatWait(model.waitMins).replace('Waiting list: ', 'about ')}
            </button>
          ) : (
            <>
              {model.waitMins > 0 && (
                <p className="rounded-lg bg-accent/10 py-2 text-center text-[13px] text-accent">It's your turn. Your spot is ready.</p>
              )}
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface p-1" role="radiogroup" aria-label="How long">
                {Object.values(DURATIONS).map((d) => {
                  const on = duration === d.label;
                  const blocked = d.seconds / 3600 > model.maxHours;
                  return (
                    <button
                      key={d.label}
                      role="radio"
                      aria-checked={on}
                      disabled={blocked}
                      title={blocked ? `Limited to ${model.maxHours}h a day` : undefined}
                      onClick={() => setDuration(d.label)}
                      className={`h-8 rounded-md text-[13px] font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:text-muted/40 disabled:line-through ${
                        on ? 'bg-canvas text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => onRent(duration, model)} className="btn-primary h-12 w-full">
                Rent for <span className="tabular-nums">{inr(total)}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
