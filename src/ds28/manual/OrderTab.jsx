import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PatchSVG from '../components/PatchSVG.jsx';
import { Card, Label, Title } from '../ui.jsx';
import { ORDER_STAGES, deliveryWindow, findDelivery, findFinish, inr, shortDate } from '../data.js';

const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Order tracking, then unbox and pair. Pairing is what unlocks setup and streaming. */
export default function OrderTab({ order, onOrder, onGo, onNewOrder }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const delivered = order.stage >= ORDER_STAGES.length - 1;
  const finish = findFinish(order.design.finishId);
  const delivery = findDelivery(order.deliveryId);
  const [from, to] = deliveryWindow(order.deliveryId, new Date(order.placedAt));

  const pair = (e) => {
    e.preventDefault();
    if (norm(code) !== norm(order.serial)) {
      setError('That ID doesn’t match this order. It’s printed on the card inside the box lid, for example DS28-ANG-241.');
      return;
    }
    setError('');
    onOrder({ paired: true, pairedAt: new Date().toISOString() });
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <Label>Delivery</Label>
        <Title className="mt-1">
          {delivered ? 'Your patch has arrived' : `Arriving ${delivery.days[0] === delivery.days[1] ? shortDate(from) : `${shortDate(from)} – ${shortDate(to)}`}`}
        </Title>
        <ol className="mt-5">
          {ORDER_STAGES.map((s, i) => {
            const done = i < order.stage || (delivered && i === order.stage);
            const now = i === order.stage && !delivered;
            return (
              <li key={s.id} className="grid grid-cols-[1.75rem_1fr] gap-3">
                <span className="flex flex-col items-center">
                  <span className={`grid h-6 w-6 place-items-center rounded-full border ${done ? 'border-teal bg-teal/15 text-teal' : now ? 'border-accent text-accent' : 'border-line text-muted'}`}>
                    {done ? <Icon name="check" size={14} /> : <span className={`h-1.5 w-1.5 rounded-full ${now ? 'bg-accent' : 'bg-line'}`} />}
                  </span>
                  {i < ORDER_STAGES.length - 1 && <span className={`w-px flex-1 ${i < order.stage ? 'bg-teal/40' : 'bg-line'}`} style={{ minHeight: 22 }} />}
                </span>
                <span className="pb-4">
                  <span className={`block text-title ${done || now ? 'text-ink' : 'text-muted'}`}>{s.label}</span>
                  <span className="block text-caption text-muted">{s.detail}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {!delivered && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-line p-3">
            <span className="text-caption text-muted">Prototype control: skip ahead instead of waiting for the courier.</span>
            <button className="btn-secondary h-9 text-[13px]" onClick={() => onOrder({ stage: order.stage + 1 })}>
              Next stage <Icon name="skip_next" size={16} />
            </button>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-4 lg:col-span-2">
        {delivered && !order.paired && (
          <Card className="border-accent/50">
            <Label>Unbox and pair</Label>
            <Title className="mt-1">Connect your patch</Title>
            <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-body text-muted marker:text-accent">
              <li>Open the box and lift out the card inside the lid.</li>
              <li>Type the hardware ID printed on it below.</li>
              <li>Keep the patch within a metre of this device.</li>
            </ol>
            <form onSubmit={pair} className="mt-4 flex flex-col gap-2" noValidate>
              <label htmlFor="pair-code" className="text-[13px] text-ink">Hardware ID</label>
              <input
                id="pair-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DS28-XXX-000"
                autoComplete="off"
                aria-invalid={!!error}
                className={`h-11 rounded-lg border bg-canvas px-3 text-[15px] uppercase tracking-wide text-ink outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-accent/70 ${error ? 'border-alert' : 'border-line'}`}
              />
              {error && <p className="text-caption text-alert">{error}</p>}
              <button type="submit" className="btn-primary mt-1">
                <Icon name="link" size={18} /> Pair patch
              </button>
              <p className="text-caption text-muted">Prototype hint: your ID is {order.serial}.</p>
            </form>
          </Card>
        )}

        {order.paired && (
          <Card className="border-teal/40">
            <span className="flex items-center gap-2 text-teal"><Icon name="check_circle" size={20} /> <span className="text-title">Patch paired</span></span>
            <p className="mt-2 text-body text-muted">Next, prepare your skin and calibrate. It takes about four minutes and you only do the full routine once a day.</p>
            <button className="btn-primary mt-4" onClick={() => onGo('setup')}>
              Start setup <Icon name="arrow_forward" size={18} />
            </button>
          </Card>
        )}

        {!delivered && (
          <Card>
            <Label>While you wait</Label>
            <ul className="mt-3 flex flex-col gap-3 text-body">
              {[
                ['health_and_safety', 'Read the safety guide', 'Five minutes. Covers who shouldn’t use the patch.', 'safety'],
                ['accessibility_new', 'See where it goes', 'Learn the three wearing spots before it arrives.', 'map'],
                ['speed', 'Plan your first skill', 'Check rental prices and rest times.', 'rental'],
              ].map(([icon, t, d, go]) => (
                <li key={t}>
                  <button onClick={() => onGo(go)} className="flex w-full items-start gap-3 rounded-lg p-1 text-left hover:bg-canvas">
                    <Icon name={icon} size={20} className="mt-0.5 text-accent" />
                    <span><span className="block text-ink">{t}</span><span className="text-caption text-muted">{d}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card>
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-line bg-canvas">
              <PatchSVG shape={order.design.shape} color={finish.hex} coating={order.design.coating} glow={0.4} className="h-11 w-11" />
            </div>
            <div className="min-w-0 text-body">
              <p className="text-ink">{order.design.shape.name} shell · {finish.name}</p>
              <p className="text-caption text-muted">{order.pay === 'cod' ? 'To pay on delivery' : 'Paid'} {inr(order.total)} · {order.address.city}, {order.address.pin}</p>
            </div>
          </div>
          <button className="btn-secondary mt-4 h-9 w-full text-[13px]" onClick={onNewOrder}>Order another patch</button>
        </Card>
      </div>
    </div>
  );
}
