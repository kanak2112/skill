import { memo } from 'react';
import Footage from './Footage.jsx';
import { NodeNetwork, NoOwnerTag, ShimmerBorder, SignatureWatermark, TypeBadge, VerifiedCrest, Wireframe } from './ModelVisuals.jsx';
import { MODEL_TYPES, inr } from '../data/catalog.js';

function TileBody({ model, offset, speed }) {
  const type = MODEL_TYPES[model.type];
  return (
    <div className="relative h-full overflow-hidden rounded-[11px] bg-surface">
      <div className="absolute inset-0 animate-drift">
        <Footage scene={model.scene} variant={model.variant} src={model.video} offset={offset} speed={speed} className="h-full w-full" />
      </div>

      {model.type === 'composite' && <NodeNetwork className="absolute inset-0 h-full w-full" />}
      {model.type === 'synthetic' && <Wireframe className="absolute inset-0 h-full w-full" />}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
        <div className="flex flex-col items-start gap-1">
          <TypeBadge label={type.label} />
          {model.type === 'synthetic' && <NoOwnerTag />}
        </div>
        {model.type === 'personal' && <VerifiedCrest size={18} />}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas/85 to-transparent px-2.5 pb-2.5 pt-10">
        {model.type === 'personal' && <SignatureWatermark name={model.expert} className="mb-1" />}
        <p className="line-clamp-2 text-[13px] font-medium leading-tight tracking-[-0.01em] text-ink">{model.title}</p>
        <p className="mt-1 text-caption text-muted">
          <span className="tabular-nums">{inr(model.hourly)}</span>/hr · <span className="tabular-nums">{Math.round(model.match)}%</span> fit
        </p>
      </div>
    </div>
  );
}

/** One video tile in the cylinder. Structure (not colour) varies by where the skill comes from. */
function VaultTile({ model, offset = 0, speed = 1 }) {
  if (model.type === 'composite') {
    return (
      <div className="relative h-full">
        <div className="absolute inset-0 -translate-y-[12px] scale-[0.86] rounded-xl border border-line bg-surface/60" aria-hidden="true" />
        <div className="absolute inset-0 -translate-y-[6px] scale-[0.93] rounded-xl border border-line bg-surface/80" aria-hidden="true" />
        <div className="relative h-full rounded-xl border border-line">
          <TileBody model={model} offset={offset} speed={speed} />
        </div>
      </div>
    );
  }
  if (model.type === 'synthetic') {
    return (
      <ShimmerBorder className="h-full">
        <TileBody model={model} offset={offset} speed={speed} />
      </ShimmerBorder>
    );
  }
  return (
    <div className="h-full rounded-xl border border-accent/30">
      <TileBody model={model} offset={offset} speed={speed} />
    </div>
  );
}

export default memo(VaultTile);
