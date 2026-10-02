import { memo } from 'react';
import Footage from './Footage.jsx';
import { NodeNetwork, ShimmerBorder, SignatureWatermark, TypeBadge, VerifiedCrest, Wireframe } from './ModelVisuals.jsx';
import { MODEL_TYPES, inr } from '../data/catalog.js';

/**
 * `focus` 0..1: 1 = sharp and readable, 0 = fully out of focus.
 * Depth of field is applied to the footage layer only; text fades out instead
 * of blurring, the way far labels drop away through a real lens.
 */
function TileBody({ model, offset, speed, focus }) {
  const type = MODEL_TYPES[model.type];
  const blur = (1 - focus) * 6;
  return (
    <div className="relative h-full overflow-hidden rounded-[7px] bg-surface">
      <div className="absolute inset-0 animate-drift">
        <Footage scene={model.scene} variant={model.variant} src={model.video} offset={offset} speed={speed} blur={blur} className="h-full w-full" />
      </div>

      <div className="absolute inset-0 transition-opacity duration-200" style={{ opacity: focus }}>
        {model.type === 'composite' && <NodeNetwork className="absolute inset-0 h-full w-full" />}
        {model.type === 'synthetic' && <Wireframe className="absolute inset-0 h-full w-full" />}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
          <TypeBadge label={type.label} />
          {model.type === 'personal' && <VerifiedCrest size={18} />}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas/90 to-transparent px-3 pb-3 pt-12">
          {model.type === 'personal' && <SignatureWatermark name={model.expert} className="mb-1" />}
          <p className="line-clamp-2 text-[13px] font-medium leading-tight tracking-[-0.01em] text-ink">{model.title}</p>
          <p className="mt-1 text-caption text-ink/80">
            <span className="tabular-nums">{inr(model.hourly)}</span>/hr · <span className="tabular-nums">{Math.round(model.match)}%</span> fit
          </p>
        </div>
      </div>
    </div>
  );
}

/** One video tile in the cylinder. Structure (not colour) varies by where the skill comes from. */
function VaultTile({ model, offset = 0, speed = 1, focus = 1 }) {
  const body = <TileBody model={model} offset={offset} speed={speed} focus={focus} />;
  if (model.type === 'composite') {
    return (
      <div className="relative h-full">
        <div className="absolute inset-0 -translate-y-[12px] scale-[0.86] rounded-xl border border-line bg-surface/60" aria-hidden="true" />
        <div className="absolute inset-0 -translate-y-[6px] scale-[0.93] rounded-xl border border-line bg-surface/80" aria-hidden="true" />
        <div className="relative h-full rounded-xl border border-line">{body}</div>
      </div>
    );
  }
  if (model.type === 'synthetic') {
    return <ShimmerBorder className="h-full">{body}</ShimmerBorder>;
  }
  return <div className="h-full rounded-xl border border-accent/30">{body}</div>;
}

export default memo(VaultTile);
