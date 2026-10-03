import { useCallback, useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import Landing from './pages/Landing.jsx';
import Profiler from './pages/Profiler.jsx';
import Studio from './pages/Studio.jsx';
import Checkout from './pages/Checkout.jsx';
import Manual from './manual/Manual.jsx';
import Logo from './components/Logo.jsx';
import { presetShape } from './shapes.js';

const STORE_KEY = 'ds28.session.v2';

const STEPS = [
  { id: 'profile', label: 'Persona & skills' },
  { id: 'studio', label: 'Shape Studio' },
  { id: 'checkout', label: 'Checkout' },
];

export const DEFAULT_DESIGN = {
  shape: presetShape('anger'),
  finishId: 'red',
  coating: 'gloss',
  nodeId: 'temple',
  prompt: 'A glossy crimson anger glyph',
};
export const DEFAULT_PLAN = { skillId: 'craftsman', billing: 'monthly', hours: 2 };

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {};
  } catch {
    return {};
  }
}

/**
 * Global state: persona, plan and design flow from the storefront into the order, and the
 * order (serial, shell, finish, plan) themes and drives the Web Manual.
 */
export default function App() {
  const saved = load();
  const [mode, setMode] = useState('landing');
  const [step, setStep] = useState('profile');
  const [persona, setPersona] = useState(saved.persona ?? null);
  const [plan, setPlan] = useState(saved.plan ?? DEFAULT_PLAN);
  const [design, setDesign] = useState(saved.design ?? DEFAULT_DESIGN);
  const [order, setOrder] = useState(saved.order ?? null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ persona, plan, design, order }));
    } catch {
      /* storage blocked: state lives for this visit only */
    }
  }, [persona, plan, design, order]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [mode, step]);

  const updatePlan = useCallback((patch) => setPlan((p) => ({ ...p, ...patch })), []);
  const updateDesign = useCallback((patch) => setDesign((d) => ({ ...d, ...patch })), []);
  const updateOrder = useCallback((patch) => setOrder((o) => (o ? { ...o, ...patch } : o)), []);
  const go = (s) => {
    setMode('flow');
    setStep(s);
  };

  if (mode === 'landing') {
    return <Landing onEnter={() => go('profile')} hasOrder={!!order} onManual={() => setMode('manual')} />;
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="app flow-enter">
      <header className="topbar">
        <button className="brand" onClick={() => setMode('landing')} aria-label="Back to the Neural Stream DS-28 showcase">
          <Logo />
          <span>Neural Stream<sup>™</sup> <b>DS-28</b></span>
        </button>
        <nav className="nav" aria-label="Purchase steps">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={`nav-link step ${mode === 'flow' && step === s.id ? 'active' : ''} ${mode === 'flow' && i < stepIndex ? 'done' : ''}`}
              onClick={() => go(s.id)}
              aria-current={mode === 'flow' && step === s.id ? 'step' : undefined}
            >
              <span className="step-n mono">{i + 1}</span>
              {s.label}
            </button>
          ))}
          <button
            className={`nav-link manual-link ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
            disabled={!order}
            title={order ? `Web Manual for ${order.serial}` : 'Confirm & bond a shell to unlock the Web Manual'}
          >
            {order ? <Unlock size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
            Web Manual
          </button>
        </nav>
      </header>

      <main key={`${mode}-${step}`} className="page-enter">
        {mode === 'flow' && step === 'profile' && (
          <Profiler persona={persona} onPersona={setPersona} plan={plan} onPlan={updatePlan} onNext={() => go('studio')} />
        )}
        {mode === 'flow' && step === 'studio' && (
          <Studio design={design} onChange={updateDesign} onCart={() => go('checkout')} />
        )}
        {mode === 'flow' && step === 'checkout' && (
          <Checkout
            design={design}
            plan={plan}
            persona={persona}
            order={order}
            onEdit={go}
            onConfirm={setOrder}
            onManual={() => setMode('manual')}
          />
        )}
        {mode === 'manual' && order && (
          <Manual order={order} onOrder={updateOrder} onNewShell={() => go('studio')} />
        )}
      </main>

      <footer className="footer">
        <span>Neural Stream™ DS-28 · Speculative design fiction set in 2035. Not a medical device. All figures fictional.</span>
        <span className="mono">FW 4.11.2 · NSX-CLINIC CLASS IIb (fictional)</span>
      </footer>
    </div>
  );
}
