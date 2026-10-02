import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight, MoveHorizontal, MoveVertical } from 'lucide-react';
import VaultTile from '../components/VaultTile.jsx';
import { TypeBadge } from '../components/ModelVisuals.jsx';
import { DOMAINS, MODELS_BY_DOMAIN, MODEL_TYPES, inr } from '../data/catalog.js';
import { mod, normDeg, useCylinder } from '../hooks/useCylinder.js';

const SLOTS = 8;
const FILTERS = [{ id: 'all', label: 'All' }, ...Object.values(MODEL_TYPES).map((t) => ({ id: t.id, label: t.label }))];

const modelAt = (row, slot) => {
  const list = MODELS_BY_DOMAIN[DOMAINS[mod(row, DOMAINS.length)].id];
  return list[mod(slot, list.length)];
};

function FilterBar({ filter, onFilter }) {
  const active = MODEL_TYPES[filter];
  return (
    <div className="shrink-0 px-5 pt-4">
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-surface p-1" role="radiogroup" aria-label="Model provenance">
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              role="radio"
              aria-checked={on}
              onClick={() => onFilter(f.id)}
              className={`h-8 rounded-md text-[13px] font-medium transition-colors ${
                on ? 'bg-canvas text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 min-h-[50px] text-[12px] leading-snug text-muted">
        {active ? (
          <>
            <span className="font-medium text-ink">{active.paradigm}.</span> {active.copy}
          </>
        ) : (
          'Every model in the vault, across all three provenance paradigms.'
        )}
      </p>
    </div>
  );
}

function DomainRail({ centerRow, onJump }) {
  const current = mod(centerRow, DOMAINS.length);
  return (
    <div className="absolute right-1.5 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 rounded-full bg-canvas/70 px-0.5 py-1.5 backdrop-blur-sm" role="tablist" aria-label="Skill domain">
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
  const [size, setSize] = useState({ w: 390, h: 520 });
  const [filter, setFilter] = useState('all');
  const openTimer = useRef(0);

  useLayoutEffect(() => {
    const el = stageRef.current;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tileW = Math.round(Math.min(172, size.w * 0.44));
  const tileH = Math.round(tileW * 1.4);
  const stepRad = (2 * Math.PI) / SLOTS;
  const spacing = tileW + 22;
  const radius = spacing / stepRad;
  const rowPx = tileH + 40;

  const matches = useCallback((m) => filter === 'all' || m.type === filter, [filter]);

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

  // When the filter hides the centred tile, rotate to the nearest match.
  useEffect(() => {
    if (matches(modelAt(cyl.centerRow, cyl.centerSlot))) return;
    for (const d of [1, -1, 2, -2, 3, -3, 4]) {
      if (matches(modelAt(cyl.centerRow, cyl.centerSlot + d))) {
        cyl.focus(cyl.centerRow, mod(cyl.centerSlot + d, SLOTS));
        return;
      }
    }
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const jumpToDomain = (i) => {
    const cur = mod(cyl.centerRow, DOMAINS.length);
    let delta = i - cur;
    if (delta > 2) delta -= 4;
    if (delta < -2) delta += 4;
    cyl.moveRows(delta);
  };

  const onKeyDown = (e) => {
    const map = { ArrowLeft: () => cyl.rotateBy(-1), ArrowRight: () => cyl.rotateBy(1), ArrowUp: () => cyl.moveRows(-1), ArrowDown: () => cyl.moveRows(1) };
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (matches(focused)) onOpen(focused);
    }
  };

  const focused = modelAt(cyl.centerRow, cyl.centerSlot);
  const domain = DOMAINS[mod(cyl.centerRow, DOMAINS.length)];

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
      const x = radius * Math.sin(r);
      const z = radius * (1 - Math.cos(r));
      const m = modelAt(k, i);
      const on = matches(m);
      const shade = Math.min(Math.abs(rel) / 60, 1) * 0.45;
      tiles.push(
        <div
          key={i}
          data-slot={on ? i : undefined}
          data-row={on ? k : undefined}
          className={`absolute left-1/2 top-1/2 transition-opacity duration-300 ${on ? 'cursor-pointer' : 'pointer-events-none'}`}
          style={{
            width: tileW,
            height: tileH,
            marginLeft: -tileW / 2,
            marginTop: -tileH / 2,
            transform: `translate3d(${x}px,0,${z}px) rotateY(${-rel / 3}deg)`,
            opacity: on ? 1 : 0.16,
            filter: on ? undefined : 'grayscale(1)',
          }}
        >
          <VaultTile model={m} offset={i * 0.37 + mod(k, DOMAINS.length) * 1.3} />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-canvas" style={{ opacity: shade }} />
        </div>,
      );
    }
    rows.push(
      <div
        key={k}
        className="preserve-3d absolute inset-0"
        style={{
          transform: `translate3d(0,${dk * rowPx}px,${-Math.abs(dk) * 60}px) rotateX(${dk * 10}deg)`,
          opacity: 1 - Math.min(Math.abs(dk), 1.4) * 0.5,
        }}
        aria-hidden={Math.round(dk) !== 0}
      >
        {tiles}
      </div>,
    );
  }

  return (
    <div className="flex h-full flex-col">
      <FilterBar filter={filter} onFilter={setFilter} />

      <div className="flex shrink-0 items-baseline justify-between px-5 pb-1">
        <h2 className="text-[17px] font-semibold text-ink">{domain.label}</h2>
        <span className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <MoveHorizontal className="h-3 w-3" /> Rotate
          </span>
          <span className="flex items-center gap-1">
            <MoveVertical className="h-3 w-3" /> Domains
          </span>
        </span>
      </div>

      <div
        ref={stageRef}
        tabIndex={0}
        role="application"
        aria-roledescription="Cylindrical skill carousel"
        aria-label={`${domain.label} skills. Use arrow keys to browse, Enter to open.`}
        onKeyDown={onKeyDown}
        {...cyl.handlers}
        className={`relative min-h-0 flex-1 select-none overflow-hidden outline-none ${cyl.dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ perspective: '900px', touchAction: 'none' }}
      >
        <div className="preserve-3d absolute inset-0">{rows}</div>
        {/* Edge fades suggest the cylinder continues past the viewport */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-canvas to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-canvas to-transparent" />
        <DomainRail centerRow={cyl.centerRow} onJump={jumpToDomain} />
      </div>

      {/* Focused tile caption */}
      <div className="shrink-0 border-t border-line px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TypeBadge type={focused.type} label={MODEL_TYPES[focused.type].label} />
              <span className="truncate text-[12px] text-muted">{focused.expert ?? (focused.trainedOn ? `Trained on ${focused.trainedOn}` : 'Machine-generated')}</span>
            </div>
            <p className="mt-1.5 truncate text-[15px] font-semibold text-ink">{focused.title}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              <span className="tabular-nums">{inr(focused.hourly)}</span>/hr · <span className="tabular-nums">{focused.match}%</span> match
            </p>
          </div>
          <button
            onClick={() => onOpen(focused)}
            disabled={!matches(focused)}
            className="btn-primary h-10 shrink-0 px-3.5 text-[14px]"
          >
            Details <ChevronRight className="-mr-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
