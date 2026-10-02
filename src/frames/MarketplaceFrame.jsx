import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import VaultTile from '../components/VaultTile.jsx';
import { DOMAINS, MODELS_BY_DOMAIN, MODEL_TYPES, SUGGESTIONS, matchesQuery } from '../data/catalog.js';
import { mod, normDeg, useCylinder } from '../hooks/useCylinder.js';

const SLOTS = 8;
const FILTERS = [{ id: 'all', label: 'All' }, ...Object.values(MODEL_TYPES).map((t) => ({ id: t.id, label: t.filterLabel }))];
const VOICE_SAMPLE = 'Knife skill for cutting fish';

const modelAt = (row, slot) => {
  const list = MODELS_BY_DOMAIN[DOMAINS[mod(row, DOMAINS.length)].id];
  return list[mod(slot, list.length)];
};

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
      className={`flex h-11 items-center gap-2.5 rounded-lg border bg-surface pl-3 pr-1.5 transition-colors focus-within:border-muted/50 ${
        listening ? 'border-accent/60' : 'border-line'
      }`}
    >
      <Icon name="search" size={20} className="text-muted" />
      <input
        id="skill-search"
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={listening ? 'Listening…' : 'Search skills, tasks, or experts...'}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        aria-label="Search skills, tasks, or experts"
      />
      {query && (
        <button onClick={() => onQuery('')} className="p-1 text-muted hover:text-ink" aria-label="Clear search">
          <Icon name="close" size={18} />
        </button>
      )}
      <button
        type="button"
        onClick={listen}
        aria-label={listening ? 'Listening' : 'Search by voice'}
        aria-pressed={listening}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
          listening ? 'animate-breathe bg-accent/15 text-accent' : 'text-muted hover:bg-canvas hover:text-ink'
        }`}
      >
        <Icon name="mic" size={20} />
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
              on ? 'bg-accent/15 text-accent' : 'bg-surface text-muted hover:text-ink'
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
    <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line" role="radiogroup" aria-label="Who the skill comes from">
      {FILTERS.map((f) => {
        const on = filter === f.id;
        return (
          <button
            key={f.id}
            role="radio"
            aria-checked={on}
            onClick={() => onFilter(f.id)}
            className={`relative shrink-0 whitespace-nowrap pb-2.5 pt-1 text-[13px] transition-colors ${
              on ? 'font-medium text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {f.label}
            <span className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full ${on ? 'bg-accent' : 'bg-transparent'}`} />
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
      className="absolute right-1.5 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5"
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

export default function MarketplaceFrame({ onOpen }) {
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

  const tileW = Math.round(Math.min(184, size.w * 0.46, (size.h * 0.68) / 1.4));
  const tileH = Math.round(tileW * 1.4);
  const stepRad = (2 * Math.PI) / SLOTS;
  const spacing = tileW + 12;
  const radius = spacing / stepRad;
  const rowPx = tileH + 14;

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
      // side: 0 at centre, 1 at the neighbouring slot, >1 for cards further round the wall.
      const side = Math.min(Math.abs(rel) / 45, 2);
      const near = Math.min(side, 1);
      const far = Math.max(side - 1, 0);
      const x = radius * Math.sin(r);
      const z = -radius * (1 - Math.cos(r)) * 0.9;
      const scale = 1 - near * 0.15 - far * 0.1; // 1.0 → 0.85 → smaller
      const rotY = -Math.sign(rel) * (near * 18 + far * 10); // 0° → 18° facing the viewer
      const depthOpacity = 1 - near * 0.35 - far * 0.35; // 1.0 → 0.65 → fading
      const rowOff = Math.min(Math.abs(dk), 1);
      // Out-of-focus cards (further round the wall, or in other skill areas) lose focus progressively.
      const focus = Math.round((1 - Math.min(1, far + rowOff)) * 10) / 10;
      const m = modelAt(k, i);
      const on = matches(m);
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
            transform: `translate3d(${x}px,0,${z}px) rotateY(${rotY}deg) scale(${scale})`,
            opacity: (on ? 1 : 0.14) * Math.max(depthOpacity, 0),
            filter: on ? undefined : 'grayscale(1)',
            transition: 'opacity 300ms',
          }}
        >
          <VaultTile model={m} offset={i * 0.37 + mod(k, DOMAINS.length) * 1.3} speed={side < 0.4 && Math.abs(dk) < 0.5 ? 1 : 0.4} focus={focus} />
        </div>,
      );
    }
    rows.push(
      <div
        key={k}
        className="preserve-3d absolute inset-0"
        style={{
          // Rows recede by scale only. translateZ or rotateX on a full-width row plane makes it
          // intersect the focused row, and Chrome then drops the row from the composite.
          transform: `translate3d(0,${dk * rowPx}px,0) scale(${1 - Math.min(Math.abs(dk), 1.5) * 0.08})`,
          opacity: 1 - Math.min(Math.abs(dk), 1.4) * 0.45,
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
        <h2 className="eyebrow">{domain.label}</h2>
        <span className="text-caption text-muted">Drag to browse · tap a card to rent</span>
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
            <p className="text-title text-ink">No skills match "{query}"</p>
            <button onClick={() => setQuery('')} className="mt-2 text-[13px] text-accent">
              Clear search
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
