import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Mic, Search, Star, X } from 'lucide-react';
import VaultTile from '../components/VaultTile.jsx';
import { TypeBadge } from '../components/ModelVisuals.jsx';
import { DOMAINS, MODELS_BY_DOMAIN, MODEL_TYPES, SUGGESTIONS, formatWait, inr, matchesQuery } from '../data/catalog.js';
import { mod, normDeg, useCylinder } from '../hooks/useCylinder.js';

const SLOTS = 8;
const FILTERS = [{ id: 'all', label: 'All' }, ...Object.values(MODEL_TYPES).map((t) => ({ id: t.id, label: t.filterLabel }))];
const VOICE_SAMPLE = 'Knife skill for cutting fish';

const modelAt = (row, slot) => {
  const list = MODELS_BY_DOMAIN[DOMAINS[mod(row, DOMAINS.length)].id];
  return list[mod(slot, list.length)];
};

export const skillName = (m) => (m.expert ? `${m.expert} — ${m.title.replace(/ v\d.*$/, '')}` : m.title);

function SearchBar({ query, onQuery }) {
  const [listening, setListening] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Voice input is simulated: device microphones aren't available to the prototype.
  const listen = () => {
    if (listening) return;
    setListening(true);
    onQuery('');
    timer.current = setTimeout(() => {
      setListening(false);
      onQuery(VOICE_SAMPLE);
    }, 1600);
  };

  return (
    <label
      className={`flex h-11 items-center gap-2.5 rounded-xl border bg-surface pl-3.5 pr-1.5 transition-colors focus-within:border-accent ${
        listening ? 'border-accent' : 'border-line'
      }`}
    >
      <Search className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
      <input
        id="skill-search"
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={listening ? 'Listening…' : 'Search skills, tasks, or experts...'}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        aria-label="Search skills, tasks, or experts"
      />
      {query && (
        <button onClick={() => onQuery('')} className="p-1 text-muted hover:text-ink" aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={listen}
        aria-label={listening ? 'Listening' : 'Search by voice'}
        aria-pressed={listening}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
          listening ? 'animate-breathe bg-accent text-white' : 'text-muted hover:bg-canvas hover:text-ink'
        }`}
      >
        <Mic className="h-4 w-4" />
      </button>
    </label>
  );
}

function Suggestions({ query, onQuery }) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      {SUGGESTIONS.map((s) => {
        const on = query.toLowerCase() === s.toLowerCase();
        return (
          <button
            key={s}
            onClick={() => onQuery(on ? '' : s)}
            aria-pressed={on}
            className={`h-7 shrink-0 rounded-full px-3 text-[12px] transition-colors ${
              on ? 'bg-ink text-canvas' : 'border border-line text-muted hover:text-ink'
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

function FilterBar({ filter, onFilter }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-lg bg-surface p-1" role="radiogroup" aria-label="Who the skill comes from">
      {FILTERS.map((f) => {
        const on = filter === f.id;
        return (
          <button
            key={f.id}
            role="radio"
            aria-checked={on}
            onClick={() => onFilter(f.id)}
            className={`h-8 rounded-md px-1 text-[12px] font-medium leading-tight transition-colors ${
              on ? 'bg-canvas text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function DomainRail({ centerRow, onJump }) {
  const current = mod(centerRow, DOMAINS.length);
  return (
    <div
      className="absolute right-1.5 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 rounded-full bg-canvas/70 px-0.5 py-1.5 backdrop-blur-sm"
      role="tablist"
      aria-label="Skill area"
    >
      {DOMAINS.map((d, i) => (
        <button
          key={d.id}
          role="tab"
          aria-selected={i === current}
          aria-label={d.label}
          onClick={() => onJump(i)}
          className="group flex h-4 w-4 items-center justify-center"
        >
          <span
            className={`block rounded-full transition-all ${
              i === current ? 'h-4 w-1.5 bg-ink' : 'h-1.5 w-1.5 bg-muted/60 group-hover:bg-muted'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function MarketplaceFrame({ onOpen, onRent }) {
  const stageRef = useRef(null);
  const [size, setSize] = useState({ w: 390, h: 440 });
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const openTimer = useRef(0);

  useLayoutEffect(() => {
    const el = stageRef.current;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tileW = Math.round(Math.min(168, size.w * 0.42, (size.h * 0.7) / 1.4));
  const tileH = Math.round(tileW * 1.4);
  const stepRad = (2 * Math.PI) / SLOTS;
  const spacing = tileW + 12;
  const radius = spacing / stepRad;
  const rowPx = tileH + 36;

  const matches = useCallback(
    (m) => (filter === 'all' || m.type === filter) && matchesQuery(m, query),
    [filter, query],
  );

  const cyl = useCylinder({
    slots: SLOTS,
    degPerPx: 360 / SLOTS / spacing,
    rowPx,
    onTap: ({ row, slot }) => {
      const m = modelAt(row, slot);
      if (!matches(m)) return;
      clearTimeout(openTimer.current);
      const centred = row === cyl.centerRow && slot === cyl.centerSlot;
      cyl.focus(row, slot);
      openTimer.current = setTimeout(() => onOpen(m), centred ? 0 : 380);
    },
  });

  useEffect(() => cyl.attachWheel(stageRef.current), [cyl.attachWheel]);
  useEffect(() => () => clearTimeout(openTimer.current), []);

  // When the filter or search hides the centred tile, bring the nearest match to the front,
  // searching nearby skill areas too.
  const [noResults, setNoResults] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => {
      if (matches(modelAt(cyl.centerRow, cyl.centerSlot))) {
        setNoResults(false);
        return;
      }
      for (const dr of [0, 1, -1, 2]) {
        const k = cyl.centerRow + dr;
        let best = null;
        for (let i = 0; i < SLOTS; i++) {
          if (!matches(modelAt(k, i))) continue;
          const dist = Math.abs(normDeg(i * cyl.step - cyl.rot));
          if (!best || dist < best.dist) best = { i, dist };
        }
        if (best) {
          setNoResults(false);
          cyl.focus(k, best.i);
          return;
        }
      }
      setNoResults(true);
    }, 220);
    return () => clearTimeout(id);
  }, [filter, query]); // eslint-disable-line react-hooks/exhaustive-deps

  const jumpToDomain = (i) => {
    const cur = mod(cyl.centerRow, DOMAINS.length);
    let delta = i - cur;
    if (delta > 2) delta -= 4;
    if (delta < -2) delta += 4;
    cyl.moveRows(delta);
  };

  const focused = modelAt(cyl.centerRow, cyl.centerSlot);
  const focusedOn = matches(focused) && !noResults;
  const domain = DOMAINS[mod(cyl.centerRow, DOMAINS.length)];

  const onKeyDown = (e) => {
    const map = {
      ArrowLeft: () => cyl.rotateBy(-1),
      ArrowRight: () => cyl.rotateBy(1),
      ArrowUp: () => cyl.moveRows(-1),
      ArrowDown: () => cyl.moveRows(1),
    };
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedOn) onOpen(focused);
    }
  };

  // Rows within view (infinite in both directions).
  const rows = [];
  for (let k = Math.floor(cyl.v) - 1; k <= Math.floor(cyl.v) + 2; k++) {
    const dk = k - cyl.v;
    if (Math.abs(dk) > 1.6) continue;
    const tiles = [];
    for (let i = 0; i < SLOTS; i++) {
      const rel = normDeg(i * cyl.step - cyl.rot);
      if (Math.abs(rel) > 100) continue;
      const r = (rel * Math.PI) / 180;
      const side = Math.min(Math.abs(rel) / 45, 1.6); // 0 at centre, 1 at the neighbouring slot
      const x = radius * Math.sin(r);
      const z = -radius * (1 - Math.cos(r)) * 0.9; // side tiles recede into the chamber wall
      const scale = 1 - Math.min(side, 1.3) * 0.18; // 100% centre → 82% neighbours
      const m = modelAt(k, i);
      const on = matches(m);
      const blur = side > 0.15 ? Math.min(side, 1.3) * 2.5 : 0;
      tiles.push(
        <div
          key={i}
          data-slot={on ? i : undefined}
          data-row={on ? k : undefined}
          className={`absolute left-1/2 top-1/2 ${on ? 'cursor-pointer' : 'pointer-events-none'}`}
          style={{
            width: tileW,
            height: tileH,
            marginLeft: -tileW / 2,
            marginTop: -tileH / 2,
            transform: `translate3d(${x}px,0,${z}px) rotateY(${-rel / 3}deg) scale(${scale})`,
            opacity: (on ? 1 : 0.14) * (1 - Math.min(side, 1.5) * 0.3),
            filter: `${blur ? `blur(${blur.toFixed(1)}px)` : ''}${on ? '' : ' grayscale(1)'}` || undefined,
            transition: 'opacity 300ms',
          }}
        >
          <VaultTile model={m} offset={i * 0.37 + mod(k, DOMAINS.length) * 1.3} speed={side < 0.4 && Math.abs(dk) < 0.5 ? 1 : 0.4} />
        </div>,
      );
    }
    rows.push(
      <div
        key={k}
        className="preserve-3d absolute inset-0"
        style={{
          transform: `translate3d(0,${dk * rowPx}px,${-Math.abs(dk) * 90}px) rotateX(${dk * 12}deg)`,
          opacity: 1 - Math.min(Math.abs(dk), 1.4) * 0.55,
        }}
        aria-hidden={Math.round(dk) !== 0}
      >
        {tiles}
      </div>,
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-3 px-5 pt-4">
        <SearchBar query={query} onQuery={setQuery} />
        <Suggestions query={query} onQuery={setQuery} />
        <FilterBar filter={filter} onFilter={setFilter} />
      </div>

      <div className="flex shrink-0 items-baseline justify-between px-5 pb-1 pt-3">
        <h2 className="text-[16px] font-semibold text-ink">{domain.label}</h2>
        <span className="text-[12px] text-muted">Drag to browse · swipe up for more</span>
      </div>

      <div
        ref={stageRef}
        tabIndex={0}
        role="application"
        aria-roledescription="Skill carousel"
        aria-label={`${domain.label} skills. Use arrow keys to browse, Enter to open.`}
        onKeyDown={onKeyDown}
        {...cyl.handlers}
        className={`relative min-h-0 flex-1 select-none overflow-hidden outline-none ${cyl.dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ perspective: '820px', touchAction: 'none' }}
      >
        <div className="preserve-3d absolute inset-0">{rows}</div>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-canvas to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-canvas to-transparent" />
        <DomainRail centerRow={cyl.centerRow} onJump={jumpToDomain} />
        {noResults && (
          <div className="absolute inset-x-8 top-1/2 z-20 -translate-y-1/2 rounded-xl border border-line bg-surface p-4 text-center">
            <p className="text-[14px] font-medium text-ink">No skills match "{query}"</p>
            <button onClick={() => setQuery('')} className="mt-2 text-[13px] text-accent">
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Selected skill */}
      <div className="shrink-0 border-t border-line px-5 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">Selected skill</p>
          <TypeBadge type={focused.type} label={MODEL_TYPES[focused.type].label} />
        </div>
        <p className="mt-1 truncate text-[16px] font-semibold text-ink">{skillName(focused)}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
          <Star className="h-3 w-3 fill-warning text-warning" strokeWidth={0} aria-label="Rating" />
          <span className="text-ink">{focused.rating}</span> ({focused.rentals}) ·{' '}
          <span className="tabular-nums">{inr(focused.hourly)}</span>/hr · <span className="tabular-nums">{Math.round(focused.match)}%</span> fit
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => onOpen(focused)} disabled={!focusedOn} className="btn-secondary h-11 px-4">
            Details
          </button>
          {focused.waitMins ? (
            <button
              onClick={() => onOpen(focused)}
              disabled={!focusedOn}
              className="btn h-11 flex-1 border border-warning/60 text-warning hover:bg-warning/10"
            >
              {formatWait(focused.waitMins)}
            </button>
          ) : (
            <button onClick={() => onRent('1h', focused)} disabled={!focusedOn} className="btn-primary h-11 flex-1">
              Rent &amp; start skill
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
