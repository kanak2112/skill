import { useEffect, useState } from 'react';
import Overview from './pages/Overview.jsx';
import Studio from './pages/Studio.jsx';
import Checkout from './pages/Checkout.jsx';
import Manual from './manual/Manual.jsx';
import Logo from './components/Logo.jsx';
import { presetShape } from './shapes.js';

const STORE_KEY = 'ds28.order';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'studio', label: 'Shape Studio' },
  { id: 'cart', label: 'Cart & Sync' },
];

export const DEFAULT_DESIGN = {
  shape: presetShape('anger'),
  finishId: 'red',
  coating: 'gloss',
  nodeId: 'temple',
  prompt: 'Sculpt a sharp crimson anger symbol with glossy metallic bevels',
};

function loadOrder() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [page, setPage] = useState('overview');
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [order, setOrder] = useState(loadOrder);

  useEffect(() => {
    try {
      if (order) localStorage.setItem(STORE_KEY, JSON.stringify(order));
      else localStorage.removeItem(STORE_KEY);
    } catch {
      /* storage unavailable: the order simply lives for this visit */
    }
  }, [order]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const updateDesign = (patch) => setDesign((d) => ({ ...d, ...patch }));
  const updateOrderDesign = (patch) => setOrder((o) => (o ? { ...o, design: { ...o.design, ...patch } } : o));

  return (
    <div className={`app ${page === 'manual' ? 'is-manual' : ''}`}>
      <header className="topbar">
        <button className="brand" onClick={() => setPage('overview')} aria-label="Neural Stream DS-28 home">
          <Logo />
          <span>
            Neural Stream<sup>™</sup> <b>DS-28</b>
          </span>
        </button>
        <nav className="nav" aria-label="Primary">
          {NAV.map((n) => (
            <button key={n.id} className={`nav-link ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              {n.label}
              {n.id === 'cart' && <span className="nav-badge">1</span>}
            </button>
          ))}
          <button
            className={`nav-link manual-link ${page === 'manual' ? 'active' : ''}`}
            onClick={() => setPage('manual')}
            disabled={!order}
            title={order ? `Web Manual for ${order.serial}` : 'Confirm an order to unlock the Web Manual'}
          >
            <span className={`dot ${order ? 'on' : ''}`} />
            Web Manual
          </button>
        </nav>
      </header>

      <main key={page} className="page-enter">
        {page === 'overview' && <Overview onStudio={() => setPage('studio')} />}
        {page === 'studio' && <Studio design={design} onChange={updateDesign} onCart={() => setPage('cart')} />}
        {page === 'cart' && (
          <Checkout
            design={design}
            order={order}
            onEdit={() => setPage('studio')}
            onConfirm={setOrder}
            onManual={() => setPage('manual')}
          />
        )}
        {page === 'manual' && order && (
          <Manual order={order} onDesign={updateOrderDesign} onReset={() => { setOrder(null); setPage('studio'); }} />
        )}
      </main>

      <footer className="footer">
        <span>Neural Stream™ DS-28 · Speculative design fiction set in 2035. Not a medical device. All figures fictional.</span>
        <span className="mono">FW 4.11.2 · NSX-CLINIC CLASS IIb (fictional)</span>
      </footer>
    </div>
  );
}
