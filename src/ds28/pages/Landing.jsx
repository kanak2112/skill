import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import HeadViewer, { MORPHS } from '../components/HeadViewer.jsx';
import PatchSVG from '../components/PatchSVG.jsx';
import { presetShape } from '../shapes.js';
import { PRICING, inr } from '../data.js';

/** Mode 1: minimal 3D showcase with a single call to action. */
export default function Landing({ onStart, order, onOrder }) {
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState('loading');
  const [leaving, setLeaving] = useState(false);
  const m = MORPHS[idx];

  const start = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onStart, 520);
  };

  return (
    <div className={`relative flex min-h-[100dvh] flex-col overflow-hidden transition-opacity duration-500 ${leaving ? 'opacity-0' : ''}`}>
      {/* Brass rim glow behind the head */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_42%,rgba(226,177,104,0.10),transparent_70%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <span className="flex items-center gap-2.5">
          <Logo />
          <span className="text-title">Neural Stream™ <span className="text-accent">DS-28</span></span>
        </span>
        {order && (
          <button className="btn-secondary h-9 text-[13px]" onClick={onOrder}>
            <Icon name="package_2" size={16} /> My order
          </button>
        )}
      </header>

      <div
        className={`relative mx-auto w-full max-w-[720px] transition-transform duration-500 [mask-image:linear-gradient(to_bottom,#000_72%,transparent)] ${leaving ? 'scale-110' : ''}`}
        style={{ height: 'min(60dvh, 620px)', minHeight: 320 }}
      >
        {state === 'error' ? (
          <div className="absolute inset-0 grid place-items-center">
            <PatchSVG shape={presetShape(m.shape)} color={m.color} glow={0.8} className="h-40 w-40" />
          </div>
        ) : (
          <HeadViewer active={idx} onActive={setIdx} onState={setState} />
        )}
      </div>
      <p className="relative z-10 -mt-6 px-4 text-center text-caption text-muted" aria-live="polite">
        Shown: <span className="text-ink">{m.name}</span> shell in {m.finish} on the temple
        {state === 'ready' && <span className="hidden sm:inline"> · drag to turn</span>}
      </p>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-5 px-4 pb-10 pt-6 text-center sm:px-6">
        <h1 className="text-balance text-[clamp(28px,4.4vw,48px)] font-medium leading-[1.1] tracking-[-0.025em]" style={{ fontVariationSettings: "'opsz' 48" }}>
          Neural Stream™ DS-28
          <span className="block text-muted">Wear your motor intent.</span>
        </h1>
        <p className="max-w-[52ch] text-body text-muted">
          A non-invasive patch that lets you rent expert motor skills by the hour. Its shell is yours to design,
          printed to order and worn like jewellery.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button className="btn-primary h-12 px-6 text-[15px]" onClick={start}>
            Get yours now <Icon name="arrow_forward" size={18} />
          </button>
          <span className="text-caption text-muted">From {inr(PRICING.kit + PRICING.shell)} incl. GST · free delivery</span>
        </div>
      </div>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-4 text-[11px] text-muted/80 sm:px-6">
        Speculative design set in 2035, not a real product. Head scan “Lee Perry-Smith” by Infinite-Realities, CC BY 3.0.
      </footer>
    </div>
  );
}
