/**
 * Skill picker for the standalone Web Manual. Wraps the cylindrical vault from the main prototype
 * (src/frames/MarketplaceFrame.jsx) so buyers can choose the skills they want in their first month.
 * Bundled with esbuild into an IIFE that exposes `window.SkillVault`; React comes from the page.
 * Everything renders inside #vault, which scopes the vault's own Tailwind build.
 */
import { useEffect, useState } from 'react';
import MarketplaceFrame from '../src/frames/MarketplaceFrame.jsx';
import Footage from '../src/components/Footage.jsx';
import Icon from '../src/components/Icon.jsx';
import { TypeBadge, VerifiedCrest } from '../src/components/ModelVisuals.jsx';
import { DOMAINS, MODELS, MODEL_TYPES, formatWait, inr } from '../src/data/catalog.js';

const MAX_SKILLS = 5;

function Detail({ model, added, full, onToggle, onClose }) {
  const type = MODEL_TYPES[model.type];
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="skill-title" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] overflow-hidden rounded-t-2xl border border-line bg-surface sm:rounded-2xl">
        <div className="relative h-44">
          <Footage scene={model.scene} variant={model.variant} src={model.video} offset={0.3} speed={1} className="h-full w-full" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <TypeBadge label={type.label} />
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/80 text-ink" aria-label="Close">
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-2">
            <h2 id="skill-title" className="flex-1 text-screen type-screen text-ink">{model.title}</h2>
            {model.type === 'personal' && <VerifiedCrest size={20} />}
          </div>
          <p className="mt-1 text-caption text-muted">{model.expert || type.copy}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-line bg-canvas p-2.5"><p className="text-caption text-muted">Price</p><p className="text-title text-ink">{inr(model.hourly)}<span className="text-caption text-muted">/h</span></p></div>
            <div className="rounded-lg border border-line bg-canvas p-2.5"><p className="text-caption text-muted">Longest session</p><p className="text-title text-ink">{model.maxHours} h</p></div>
            <div className="rounded-lg border border-line bg-canvas p-2.5"><p className="text-caption text-muted">Rating</p><p className="text-title text-ink">{model.rating}</p></div>
          </div>
          <p className="mt-3 text-caption text-muted">{formatWait(model.waitMins)} · {model.bio || type.copy}</p>
          <ul className="mt-3 space-y-1.5">
            {type.afterEffects.slice(0, 2).map((a) => (
              <li key={a} className="flex gap-2 text-caption text-ink/80"><Icon name="info" size={14} className="mt-0.5 text-muted" />{a}</li>
            ))}
          </ul>
          <button onClick={() => onToggle(model)} disabled={!added && full}
            className={`btn mt-5 h-12 w-full ${added ? 'btn-secondary' : 'bg-accent text-[#0F172A] hover:bg-[#EBC283]'}`}>
            <Icon name={added ? 'remove' : 'add'} size={18} />
            {added ? 'Remove from my first month' : full ? `You can pick up to ${MAX_SKILLS} skills` : 'Add to my first month'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillPicker({ selected = [], onChange, onDone }) {
  const [open, setOpenState] = useState(null);
  // Closing the detail sheet hands keyboard focus back to the vault.
  const setOpen = (m) => {
    setOpenState(m);
    if (!m) requestAnimationFrame(() => document.querySelector('#vault [aria-roledescription="Skill carousel"]')?.focus());
  };
  const chosen = selected.map((id) => MODELS.find((m) => m.id === id)).filter(Boolean);
  const toggle = (m) => {
    onChange(selected.includes(m.id) ? selected.filter((x) => x !== m.id) : [...selected, m.id]);
    setOpen(null);
  };
  return (
    <div id="vault" className="font-sans text-ink">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <div className="h-[680px] overflow-hidden rounded-2xl border border-line bg-canvas">
          <MarketplaceFrame onOpen={setOpen} selectedIds={selected} hint="Drag to browse · tap a card to add it" />
        </div>
        <div className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-5">
          <p className="eyebrow">Your first month</p>
          <h2 className="mt-1 text-screen type-screen text-ink">{chosen.length ? `${chosen.length} skill${chosen.length === 1 ? '' : 's'} picked` : 'Pick the skills you need'}</h2>
          <p className="mt-1 text-body text-muted">Choose up to {MAX_SKILLS}. Your plan is built around them and your profile. You can swipe up and down for other areas: {DOMAINS.map((d) => d.label.toLowerCase()).join(', ')}.</p>
          <ul className="mt-4 flex-1 space-y-2">
            {chosen.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-2.5">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md">
                  <Footage scene={m.scene} variant={m.variant} src={m.video} offset={0.5} speed={0.5} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title text-ink">{m.title}</p>
                  <p className="text-caption text-muted">{MODEL_TYPES[m.type].label} · {inr(m.hourly)}/h</p>
                </div>
                <button onClick={() => toggle(m)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-ink" aria-label={`Remove ${m.title}`}>
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
            {!chosen.length && <li className="rounded-lg border border-dashed border-line p-5 text-center text-caption text-muted">Tap a card in the vault to see it and add it here.</li>}
          </ul>
          <button onClick={onDone} disabled={!chosen.length} className="btn btn-primary mt-4 h-12 w-full">
            See my personalised plan <Icon name="arrow_forward" size={18} />
          </button>
        </div>
      </div>
      {open && <Detail model={open} added={selected.includes(open.id)} full={selected.length >= MAX_SKILLS} onToggle={toggle} onClose={() => setOpen(null)} />}
    </div>
  );
}

window.SkillVault = { SkillPicker, MODELS, MODEL_TYPES, Footage, inr };
