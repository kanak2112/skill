import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import OrderTab from './OrderTab.jsx';
import SetupTab from './SetupTab.jsx';
import RentalTab from './RentalTab.jsx';
import MapTab from './MapTab.jsx';
import SafetyTab from './SafetyTab.jsx';
import HardwareTab from './HardwareTab.jsx';
import { ORDER_STAGES, deliveryWindow, findNode, shortDate } from '../data.js';

const TABS = [
  { id: 'order', code: '00', label: 'Your order', icon: 'package_2' },
  { id: 'setup', code: '01', label: 'Setup & calibration', icon: 'my_location', needsPatch: true },
  { id: 'rental', code: '02', label: 'Skill rental', icon: 'speed' },
  { id: 'map', code: '03', label: 'Where to wear it', icon: 'accessibility_new' },
  { id: 'safety', code: '04', label: 'Safety', icon: 'health_and_safety' },
  { id: 'hardware', code: '05', label: 'What’s inside', icon: 'memory' },
];

/** Status pill: order progress before delivery, pairing after. */
function Status({ order }) {
  const node = findNode(order.design.nodeId);
  const delivered = order.stage >= ORDER_STAGES.length - 1;
  if (order.paired)
    return (
      <span className="tag gap-2 border border-teal/30 bg-teal/10 text-teal">
        <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-teal text-teal" />
        Patch connected · {node.name}
      </span>
    );
  if (delivered)
    return (
      <span className="tag gap-1.5 border border-amber/30 bg-amber/10 text-amber">
        <Icon name="inventory_2" size={14} /> Delivered · not paired yet
      </span>
    );
  const [, to] = deliveryWindow(order.deliveryId, new Date(order.placedAt));
  return (
    <span className="tag gap-1.5 border border-line text-muted">
      <Icon name="local_shipping" size={14} /> {ORDER_STAGES[order.stage].label} · arrives by {shortDate(to)}
    </span>
  );
}

/** Mode 3: the Web Manual. Hardware features stay locked until the patch is delivered and paired. */
export default function Manual({ order, onOrder, onNewOrder }) {
  const [tab, setTab] = useState(order.paired ? 'setup' : 'order');
  const [glitch, setGlitch] = useState(false);
  const locked = (t) => t.needsPatch && !order.paired;

  return (
    <div className={glitch ? 'glitch' : ''}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="min-w-0">
          <p className="text-section text-muted">Web Manual · order {order.number}</p>
          <p className="mt-0.5 text-screen type-screen text-ink">
            Hardware ID <span className="tabular-nums text-accent">{order.serial}</span>
          </p>
        </div>
        <Status order={order} />
      </div>

      <nav className="mt-4" aria-label="Manual sections">
        <div role="tablist" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={`group rounded-lg border px-3.5 py-3 text-left transition-colors ${on ? 'border-accent/60 bg-surface' : 'border-line hover:bg-surface/60'}`}
              >
                <span className="flex items-center justify-between">
                  <span className={`text-caption tabular-nums ${on ? 'text-accent' : 'text-muted'}`}>{t.code}</span>
                  <Icon name={locked(t) ? 'lock' : t.icon} size={16} className={on ? 'text-accent' : 'text-muted group-hover:text-ink'} />
                </span>
                <span className={`mt-1 block text-[14px] font-medium leading-snug ${on ? 'text-ink' : 'text-ink/75'}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div key={tab} className="mt-4 fade-in">
        {tab === 'order' && <OrderTab order={order} onOrder={onOrder} onGo={setTab} onNewOrder={onNewOrder} />}
        {tab === 'setup' && <SetupTab order={order} onOrder={onOrder} onGo={setTab} />}
        {tab === 'rental' && <RentalTab order={order} onOrder={onOrder} onGo={setTab} />}
        {tab === 'map' && <MapTab order={order} onOrder={onOrder} />}
        {tab === 'safety' && <SafetyTab order={order} onGlitch={setGlitch} onGo={setTab} />}
        {tab === 'hardware' && <HardwareTab order={order} />}
      </div>
    </div>
  );
}
