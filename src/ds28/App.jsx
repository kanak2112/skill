import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Logo from './components/Logo.jsx';
import Landing from './pages/Landing.jsx';
import Design from './pages/Design.jsx';
import Delivery from './pages/Delivery.jsx';
import Review from './pages/Review.jsx';
import Manual from './manual/Manual.jsx';
import { presetShape, makeSerial } from './shapes.js';
import { makeOrderNumber, orderTotal } from './data.js';

const STORE_KEY = 'ds28.v3';

const STEPS = [
  { id: 'design', label: 'Design' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'review', label: 'Review & pay' },
];

export const DEFAULT_DESIGN = {
  shape: { ...presetShape('anger'), source: 'shape' },
  finishId: 'red',
  coating: 'gloss',
  nodeId: 'temple',
  prompt: 'A glossy crimson anger glyph',
};

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {};
  } catch {
    return {};
  }
}

/**
 * Three modes: showcase → purchase (design, delivery, review) → Web Manual.
 * The order carries design, address and device state, so the manual reflects what was bought
 * and what has happened since (delivery stage, pairing, calibration, streams).
 */
export default function App() {
  const saved = load();
  const [mode, setMode] = useState('landing');
  const [step, setStep] = useState('design');
  const [design, setDesign] = useState(saved.design ?? DEFAULT_DESIGN);
  const [address, setAddress] = useState(saved.address ?? null);
  const [deliveryId, setDeliveryId] = useState(saved.deliveryId ?? 'standard');
  const [order, setOrder] = useState(saved.order ?? null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ design, address, deliveryId, order }));
    } catch {
      /* storage unavailable: state lasts for this visit */
    }
  }, [design, address, deliveryId, order]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [mode, step]);

  const updateDesign = useCallback((patch) => setDesign((d) => ({ ...d, ...patch })), []);
  const updateOrder = useCallback((patch) => setOrder((o) => (o ? { ...o, ...patch } : o)), []);
  const goStep = (s) => {
    if (s === 'review' && !address) s = 'delivery';
    setMode('shop');
    setStep(s);
  };

  const place = ({ pay }) => {
    setOrder({
      number: makeOrderNumber(),
      serial: makeSerial(design.shape.code),
      design: { ...design, shape: { ...design.shape } },
      address,
      deliveryId,
      pay,
      total: orderTotal(deliveryId),
      placedAt: new Date().toISOString(),
      stage: 0,
      paired: false,
      calibrated: false,
      session: null,
    });
    setMode('manual');
  };

  if (mode === 'landing') {
    return <Landing onStart={() => goStep('design')} order={order} onOrder={() => setMode('manual')} />;
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky z-40 border-b border-line bg-canvas/90 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <button className="flex items-center gap-2.5" onClick={() => setMode('landing')} aria-label="Neural Stream DS-28 home">
            <Logo />
            <span className="text-title">Neural Stream™ <span className="text-accent">DS-28</span></span>
          </button>
          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Order steps">
            {mode === 'shop' &&
              STEPS.map((s, i) => {
                const on = s.id === step;
                const done = i < stepIndex;
                return (
                  <button
                    key={s.id}
                    onClick={() => goStep(s.id)}
                    aria-current={on ? 'step' : undefined}
                    className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 text-[13px] transition-colors ${on ? 'bg-surface text-ink' : 'text-muted hover:text-ink'}`}
                  >
                    <span className={`grid h-5 w-5 place-items-center rounded-full border text-[11px] ${on ? 'border-accent text-accent' : done ? 'border-teal bg-teal/15 text-teal' : 'border-line'}`}>
                      {done ? <Icon name="check" size={12} /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            {order && mode === 'shop' && <span className="mx-1 h-5 w-px bg-line" />}
            {order && (
              <button
                onClick={() => setMode('manual')}
                className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] transition-colors ${mode === 'manual' ? 'bg-surface text-ink' : 'text-muted hover:text-ink'}`}
              >
                <Icon name="menu_book" size={16} /> Web Manual
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {mode === 'shop' && step === 'design' && <Design design={design} onChange={updateDesign} onNext={() => goStep('delivery')} />}
        {mode === 'shop' && step === 'delivery' && (
          <Delivery address={address} onAddress={setAddress} deliveryId={deliveryId} onDelivery={setDeliveryId} onBack={() => goStep('design')} onNext={() => setStep('review')} />
        )}
        {mode === 'shop' && step === 'review' && address && (
          <Review design={design} address={address} deliveryId={deliveryId} onEdit={goStep} onPlace={place} />
        )}
        {mode === 'manual' && order && <Manual order={order} onOrder={updateOrder} onNewOrder={() => goStep('design')} />}
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-x-6 gap-y-2 px-4 pb-8 text-caption text-muted sm:px-6">
        <span>Neural Stream™ DS-28 · speculative design set in 2035, not a real product</span>
        <span>Clinical Support 24/7 · 1800 210 4242</span>
      </footer>
    </div>
  );
}
