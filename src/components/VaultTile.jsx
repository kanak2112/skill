import { memo } from 'react';
import Footage from './Footage.jsx';
import { NodeNetwork, NoOwnerTag, ShimmerBorder, SignatureWatermark, TypeBadge, VerifiedCrest, Wireframe } from './ModelVisuals.jsx';
import { MODEL_TYPES, inr } from '../data/catalog.js';

function TileBody({ model, offset }) {
  const type = MODEL_TYPES[model.type];
  return (
    <div className="relative h-full overflow-hidden rounded-[11px] bg-surface">
      <Footage scene={model.scene} variant={model.variant} src={model.video} offset={offset} className="absolute inset-0" />

      {model.type === 'composite' && <NodeNetwork className="absolute inset-0 h-full w-full" />}
      {model.type === 'synthetic' && <Wireframe className="absolute inset-0 h-full w-full" />}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
        <div className="flex flex-col items-start gap-1">
          <TypeBadge type={model.type} label={type.label} />
          {model.type === 'synthetic' && <NoOwnerTag />}
        </div>
        {model.type === 'personal' && <VerifiedCrest className="h-[18px] w-[18px] shrink-0" />}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas/85 to-transparent px-2.5 pb-2.5 pt-10">
        {model.type === 'personal' && <SignatureWatermark name={model.expert} className="mb-1" />}
        <p className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-ink">{model.title}</p>
        <p className="mt-1 text-[11px] text-muted">
          <span className="tabular-nums">{inr(model.hourly)}</span>/hr · <span className="tabular-nums">{model.match}%</span>
        </p>
      </div>
    </div>
  );
}

/** One video tile in the cylinder. Visual treatment varies by model provenance. */
function VaultTile({ model, offset = 0 }) {
  if (model.type === 'composite') {
    return (
      <div className="relative h-full">
        <div className="absolute inset-0 -translate-y-[12px] scale-[0.86] rounded-xl border border-line bg-surface/60" aria-hidden="true" />
        <div className="absolute inset-0 -translate-y-[6px] scale-[0.93] rounded-xl border border-line bg-surface/80" aria-hidden="true" />
        <div className="relative h-full rounded-xl border border-accent/40 p-0">
          <TileBody model={model} offset={offset} />
        </div>
      </div>
    );
  }
  if (model.type === 'synthetic') {
    return (
      <ShimmerBorder className="h-full">
        <TileBody model={model} offset={offset} />
      </ShimmerBorder>
    );
  }
  return (
    <div className="h-full rounded-xl border border-cyan/40">
      <TileBody model={model} offset={offset} />
    </div>
  );
}

export default memo(VaultTile);
