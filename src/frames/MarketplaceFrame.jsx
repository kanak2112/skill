import { useMemo, useState } from 'react';
import { ChevronRight, Crosshair, Layers, Loader2, Radio, ShieldAlert, Star, X } from 'lucide-react';
import { DURATIONS } from '../hooks/useSessionTimer.js';
import { AlertBox, CornerMarks, SectionLabel, Tag } from '../components/ui.jsx';

const TIERS = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'composite', label: 'Composite' },
  { id: 'synthetic', label: 'Synthetic' },
];

const MODELS = [
  {
    id: 'arjun-knife',
    tier: 'personal',
    serial: '#0092-P',
    title: 'Chef Arjun Mehra — Culinary Knife Techniques v2.1',
    subtitle: 'Motor Cortex Mapping • Precision Slicing Profile',
    profile: 'Chef Arjun Mehra — Knife Prep',
    rating: '4.9',
    rentals: '14.2k',
    match: '96.4%',
    motorLoad: '120 Hz',
    hourlyRate: 1850,
  },
  {
    id: 'sobo-vernacular',
    tier: 'composite',
    serial: '#4471-C',
    title: 'South Mumbai Vernacular & Navigation v4.2',
    profile: 'South Mumbai Vernacular & Navigation',
    hourlyRate: 120,
    trainedOn: '12.4K',
    match: '94%',
  },
];

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function SearchBar({ query, onQuery }) {
  return (
    <label className="flex items-center gap-2.5 rounded-sm border border-syn-hairline bg-syn-surface px-3 focus-within:border-syn-frame">
      <Crosshair className="h-4 w-4 shrink-0 text-syn-cyan" strokeWidth={1.75} />
      <input
        type="text"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="SEARCH NEURAL ASSETS..."
        spellCheck={false}
        className="h-10 w-full bg-transparent font-mono text-[12px] uppercase tracking-instrument text-syn-ink placeholder:text-syn-muted focus:outline-none"
        aria-label="Search neural assets"
      />
      {query && (
        <button onClick={() => onQuery('')} className="text-syn-muted hover:text-syn-ink" aria-label="Clear search">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </label>
  );
}

function TierSelector({ tier, onTier, counts }) {
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-sm border border-syn-hairline" role="tablist" aria-label="Model tier">
      {TIERS.map((t, i) => {
        const active = tier === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onTier(t.id)}
            className={`flex items-center justify-center gap-1 py-2 font-mono text-[10px] font-semibold uppercase tracking-wide transition-colors ${
              i > 0 ? 'border-l border-syn-hairline' : ''
            } ${active ? 'bg-syn-cyan text-syn-canvas' : 'bg-syn-surface text-syn-muted hover:text-syn-ink'}`}
          >
            {t.label}
            <span className={`t-data text-[9px] ${active ? 'text-syn-canvas/70' : 'text-syn-muted/70'}`}>{counts[t.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

function MetricCell({ label, value, sub, valueClass = 'text-syn-ink', className = '' }) {
  return (
    <div className={`bg-syn-surface px-3 py-2.5 ${className}`}>
      <p className="t-label">{label}</p>
      <p className={`t-data mt-2 text-[20px] font-bold leading-none ${valueClass}`}>{value}</p>
      {sub && <p className="t-data mt-1.5 text-[9px] uppercase tracking-wide text-syn-muted">{sub}</p>}
    </div>
  );
}

function FeaturedCard({ model, onRent, sessionActive }) {
  const [duration, setDuration] = useState('1H');
  const [pending, setPending] = useState(false);
  const total = model.hourlyRate * DURATIONS[duration].multiplier;

  const handleRent = () => {
    if (pending) return;
    setPending(true);
    // Simulated neural handshake before the stream mounts.
    setTimeout(() => {
      setPending(false);
      onRent(duration, model.profile);
    }, 900);
  };

  return (
    <article className="relative rounded-sm border border-syn-frame bg-syn-surface">
      <CornerMarks tone="border-syn-cyan" />
      {/* Header badges */}
      <div className="flex items-center justify-between border-b border-syn-hairline px-3 py-2">
        <Tag tone="amber">
          <ShieldAlert className="h-2.5 w-2.5" strokeWidth={2.5} />
          Class-III BCI Model
        </Tag>
        <span className="t-data text-[10px] font-semibold tracking-instrument text-syn-muted">{model.serial}</span>
      </div>

      {/* Title block */}
      <div className="px-3 pb-3 pt-3">
        <p className="t-label mb-2 text-syn-cyan">Featured // Personal Tier</p>
        <h2 className="font-sans text-[17px] font-bold leading-snug text-syn-ink">{model.title}</h2>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-syn-muted">{model.subtitle}</p>
      </div>

      {/* 2x2 flush instrument grid — 1px hairlines via gap over a hairline backplate */}
      <div className="grid grid-cols-2 gap-px border-y border-syn-hairline bg-syn-hairline">
        <MetricCell
          label="Rating"
          value={
            <span className="inline-flex items-baseline gap-1">
              {model.rating}
              <Star className="h-3.5 w-3.5 -translate-y-px fill-syn-amber text-syn-amber" strokeWidth={0} />
            </span>
          }
          sub={`${model.rentals} rentals`}
        />
        <MetricCell label="Synaptic Match" value={model.match} sub="Cortical fit index" valueClass="text-syn-cyan" />
        <MetricCell label="Motor Load" value={model.motorLoad} sub="Peak efferent rate" />
        <MetricCell label="Hourly Rate" value={inr(model.hourlyRate)} sub="Per 60 min stream" />
      </div>

      {/* Duration selector */}
      <div className="px-3 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="t-label">Stream Duration</span>
          <span className="t-data text-[10px] tracking-wide text-syn-muted">
            EST. <span className="text-syn-ink">{inr(total)}</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-syn-hairline bg-syn-hairline">
          {Object.values(DURATIONS).map((d) => {
            const active = duration === d.label;
            return (
              <button
                key={d.label}
                onClick={() => setDuration(d.label)}
                aria-pressed={active}
                className={`relative py-2.5 font-mono text-[12px] font-bold tracking-instrument transition-colors ${
                  active ? 'bg-syn-cyan/[0.12] text-syn-cyan' : 'bg-syn-canvas text-syn-muted hover:text-syn-ink'
                }`}
              >
                {d.label}
                {active && <span className="absolute inset-x-0 top-0 h-[2px] bg-syn-cyan" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="p-3">
        <button onClick={handleRent} disabled={pending} className="btn-cyan h-12 w-full text-[12px] disabled:opacity-100">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
              Establishing Neural Handshake…
            </>
          ) : (
            <>
              Rent & Stream Model — {inr(total)}
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </>
          )}
        </button>
        {sessionActive && !pending && (
          <p className="t-data mt-2 text-center text-[9px] uppercase tracking-wide text-syn-amber">
            Active stream on patch #T3-99 will be superseded
          </p>
        )}
      </div>
    </article>
  );
}

function CompositeCard({ model, onRent }) {
  return (
    <article className="panel">
      <div className="flex items-center justify-between border-b border-syn-hairline px-3 py-2">
        <Tag tone="cyan">
          <Layers className="h-2.5 w-2.5" strokeWidth={2.5} />
          Composite Aggregate
        </Tag>
        <span className="t-data text-[10px] font-semibold tracking-instrument text-syn-muted">{model.serial}</span>
      </div>
      <div className="flex items-start justify-between gap-3 px-3 py-3">
        <h3 className="font-sans text-[14px] font-semibold leading-snug text-syn-ink">{model.title}</h3>
        <div className="shrink-0 text-right">
          <p className="t-data text-[16px] font-bold leading-none text-syn-ink">{inr(model.hourlyRate)}</p>
          <p className="t-label mt-1">/hr</p>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-px border-t border-syn-hairline bg-syn-hairline">
        <div className="flex items-center bg-syn-surface px-3 py-2">
          <span className="t-data text-[10px] font-semibold uppercase tracking-wide text-syn-muted">
            Trained on <span className="text-syn-ink">{model.trainedOn}</span> users
          </span>
        </div>
        <div className="flex items-center bg-syn-surface px-3 py-2">
          <span className="t-data text-[10px] font-bold uppercase tracking-wide text-syn-cyan">{model.match} Match</span>
        </div>
        <button
          onClick={() => onRent('1H', model.profile)}
          className="flex items-center gap-1 bg-syn-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wide text-syn-ink transition-colors hover:bg-syn-hairline"
          aria-label={`Stream ${model.title}`}
        >
          Stream <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}

function EmptyState({ tier, query }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-syn-hairline px-6 py-10 text-center">
      <Radio className="h-5 w-5 text-syn-muted" strokeWidth={1.5} />
      <p className="font-mono text-[11px] font-bold uppercase tracking-instrument text-syn-ink">No Assets Indexed</p>
      <p className="font-mono text-[10px] uppercase leading-relaxed tracking-wide text-syn-muted">
        {tier === 'synthetic' && !query
          ? 'Synthetic tier pending CDSCO batch approval. Next index window: 2035-Q3.'
          : `Zero matches for "${query}" in ${tier} tier.`}
      </p>
    </div>
  );
}

export default function MarketplaceFrame({ onRent, sessionStatus }) {
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODELS;
    return MODELS.filter((m) => [m.title, m.subtitle, m.serial].filter(Boolean).some((f) => f.toLowerCase().includes(q)));
  }, [query]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      personal: searched.filter((m) => m.tier === 'personal').length,
      composite: searched.filter((m) => m.tier === 'composite').length,
      synthetic: searched.filter((m) => m.tier === 'synthetic').length,
    }),
    [searched],
  );

  const visible = tier === 'all' ? searched : searched.filter((m) => m.tier === tier);
  const featured = visible.find((m) => m.tier === 'personal');
  const composites = visible.filter((m) => m.tier === 'composite');

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <SearchBar query={query} onQuery={setQuery} />
        <TierSelector tier={tier} onTier={setTier} counts={counts} />
      </div>

      <SectionLabel index="//" right={`${visible.length} RESULT${visible.length === 1 ? '' : 'S'}`}>
        Neural Asset Index
      </SectionLabel>

      {visible.length === 0 && <EmptyState tier={tier} query={query} />}
      {featured && <FeaturedCard model={featured} onRent={onRent} sessionActive={sessionStatus === 'active'} />}
      {composites.map((m) => (
        <CompositeCard key={m.id} model={m} onRent={onRent} />
      ))}

      <AlertBox tone="amber">
        <span className="font-bold text-syn-amber">CDSCO NOTICE:</span> High-frequency neural overlay. Calibrate temporal
        patch prior to streaming.
      </AlertBox>
    </div>
  );
}
