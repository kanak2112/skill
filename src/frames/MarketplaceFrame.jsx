import { useMemo, useState } from 'react';
import { ChevronRight, Search, Star, X } from 'lucide-react';
import { DURATIONS } from '../hooks/useSessionTimer.js';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'composite', label: 'Composite' },
];

const SKILLS = [
  {
    id: 'arjun-knife',
    category: 'personal',
    title: 'Chef Arjun Mehra — Culinary Knife Techniques',
    subtitle: 'Motor Cortex Mapping',
    profile: 'Chef Arjun Mehra — Knife Prep',
    rating: '4.9',
    reviews: '14k',
    match: '96.4%',
    hourlyRate: 1850,
  },
  {
    id: 'sobo-navigation',
    category: 'composite',
    title: 'South Mumbai Navigation & Vernacular',
    profile: 'South Mumbai Navigation & Vernacular',
    match: '94%',
    hourlyRate: 120,
  },
];

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function SearchBar({ query, onQuery }) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-lg border border-line bg-surface px-3.5 focus-within:border-accent">
      <Search className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
      <input
        type="text"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search skills..."
        className="w-full bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
        aria-label="Search skills"
      />
      {query && (
        <button onClick={() => onQuery('')} className="text-muted hover:text-ink" aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  );
}

function CategoryFilter({ category, onCategory }) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Category">
      {CATEGORIES.map((c) => {
        const active = category === c.id;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            onClick={() => onCategory(c.id)}
            className={`h-8 rounded-full px-4 text-[13px] font-medium transition-colors ${
              active ? 'bg-ink text-canvas' : 'border border-line text-muted hover:text-ink'
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function Spec({ label, children }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-[17px] font-semibold text-ink">{children}</dd>
    </div>
  );
}

function PrimarySkillCard({ skill, onRent }) {
  const [duration, setDuration] = useState('1h');
  const total = skill.hourlyRate * DURATIONS[duration].multiplier;

  return (
    <article className="card p-5">
      <span className="inline-flex rounded-md bg-warning/10 px-2 py-1 text-[12px] font-medium text-warning">
        Class-III Model
      </span>

      <h2 className="mt-3 text-[18px] font-semibold leading-snug text-ink">{skill.title}</h2>
      <p className="mt-1 text-[14px] text-muted">{skill.subtitle}</p>

      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
        <Spec label="Rating">
          <span className="inline-flex items-center gap-1">
            {skill.rating}
            <Star className="h-3.5 w-3.5 fill-warning text-warning" strokeWidth={0} aria-label="stars" />
            <span className="text-[13px] font-normal text-muted">({skill.reviews})</span>
          </span>
        </Spec>
        <Spec label="Neural match">
          <span className="tabular-nums">{skill.match}</span>
        </Spec>
        <Spec label="Rate">
          <span className="tabular-nums">{inr(skill.hourlyRate)}</span>
          <span className="text-[13px] font-normal text-muted">/hr</span>
        </Spec>
      </dl>

      <div className="mt-5">
        <p className="mb-2 text-[13px] text-muted">Duration</p>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-canvas p-1" role="radiogroup" aria-label="Duration">
          {Object.values(DURATIONS).map((d) => {
            const active = duration === d.label;
            return (
              <button
                key={d.label}
                role="radio"
                aria-checked={active}
                onClick={() => setDuration(d.label)}
                className={`h-9 rounded-md text-[14px] font-medium tabular-nums transition-colors ${
                  active ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={() => onRent(duration, skill.profile)} className="btn-primary mt-5 h-12 w-full">
        Rent Skill — <span className="tabular-nums">{inr(total)}</span>
      </button>
    </article>
  );
}

function SecondaryListing({ skill, onRent }) {
  return (
    <button
      onClick={() => onRent('1h', skill.profile)}
      className="card flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:border-muted/50"
    >
      <div className="min-w-0">
        <h3 className="text-[16px] font-semibold leading-snug text-ink">{skill.title}</h3>
        <p className="mt-1.5 text-[13px] text-muted">
          Composite <span aria-hidden="true">•</span>{' '}
          <span className="tabular-nums">{inr(skill.hourlyRate)}</span>/hr <span aria-hidden="true">•</span>{' '}
          <span className="tabular-nums">{skill.match}</span> Match
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
    </button>
  );
}

export default function MarketplaceFrame({ onRent }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SKILLS.filter(
      (s) =>
        (category === 'all' || s.category === category) &&
        (!q || [s.title, s.subtitle].filter(Boolean).some((f) => f.toLowerCase().includes(q))),
    );
  }, [query, category]);

  const primary = visible.find((s) => s.category === 'personal');
  const secondary = visible.filter((s) => s.category === 'composite');

  return (
    <div className="space-y-5 p-5">
      <div className="space-y-3">
        <SearchBar query={query} onQuery={setQuery} />
        <CategoryFilter category={category} onCategory={setCategory} />
      </div>

      {primary && <PrimarySkillCard skill={primary} onRent={onRent} />}
      {secondary.map((s) => (
        <SecondaryListing key={s.id} skill={s} onRent={onRent} />
      ))}
      {visible.length === 0 && <p className="py-10 text-center text-[14px] text-muted">No skills match your search.</p>}
    </div>
  );
}
