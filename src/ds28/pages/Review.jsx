import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PatchSVG from '../components/PatchSVG.jsx';
import { Card, Label, PageHead } from '../ui.jsx';
import { COATINGS, PRICING, deliveryWindow, findDelivery, findFinish, findNode, inr, orderTotal, shortDate } from '../data.js';

const PAY = [
  { id: 'upi', label: 'UPI', icon: 'qr_code_2' },
  { id: 'card', label: 'Card', icon: 'credit_card' },
  { id: 'cod', label: 'Pay on delivery', icon: 'payments' },
];

/** Step 3: one last look, then place the order. This prototype takes no payment details. */
export default function Review({ design, address, deliveryId, onEdit, onPlace }) {
  const [pay, setPay] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const finish = findFinish(design.finishId);
  const node = findNode(design.nodeId);
  const delivery = findDelivery(deliveryId);
  const [from, to] = deliveryWindow(deliveryId);
  const total = orderTotal(deliveryId);

  const place = () => {
    if (placing) return;
    setPlacing(true);
    setTimeout(() => onPlace({ pay }), 900);
  };

  const Row = ({ label, value, sub }) => (
    <li className="flex justify-between gap-4 border-b border-line py-3 last:border-0">
      <span>
        <span className="text-body text-ink">{label}</span>
        {sub && <span className="block text-caption text-muted">{sub}</span>}
      </span>
      <span className="text-body text-ink tabular-nums">{value}</span>
    </li>
  );

  return (
    <div className="fade-in">
      <PageHead step="Step 3 of 3" title="Review and place your order">
        Check the details below. You can still change anything before you pay.
      </PageHead>

      <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="flex flex-col gap-4 sm:flex-row">
            <div className="grid aspect-square w-full max-w-[160px] shrink-0 place-items-center rounded-lg border border-line bg-canvas">
              <PatchSVG shape={design.shape} color={finish.hex} coating={design.coating} glow={0.5} className="h-24 w-24" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>Your shell</Label>
                  <p className="mt-1 text-title text-ink">{design.shape.name}</p>
                </div>
                <button className="btn-secondary h-8 px-3 text-[12px]" onClick={() => onEdit('design')}>Edit</button>
              </div>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-body">
                <dt className="text-muted">Colour</dt><dd className="text-ink">{finish.name}</dd>
                <dt className="text-muted">Finish</dt><dd className="text-ink">{COATINGS.find((c) => c.id === design.coating).name}</dd>
                <dt className="text-muted">Worn on</dt><dd className="text-ink">{node.name}</dd>
              </dl>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <Label>Delivering to</Label>
              <button className="btn-secondary h-8 px-3 text-[12px]" onClick={() => onEdit('delivery')}>Edit</button>
            </div>
            <address className="mt-2 not-italic text-body text-ink">
              {address.name}<br />
              {address.line1}{address.line2 && <>, {address.line2}</>}<br />
              {address.city}, {address.state} {address.pin}<br />
              <span className="text-muted">+91 {address.phone}</span>
            </address>
            <p className="mt-3 flex items-center gap-2 text-caption text-muted">
              <Icon name="local_shipping" size={16} className="text-accent" />
              {delivery.name} delivery · arrives {delivery.days[0] === delivery.days[1] ? shortDate(from) : `${shortDate(from)} – ${shortDate(to)}`}
            </p>
          </Card>

          <Card>
            <Label>In the box</Label>
            <p className="mt-2 text-body text-muted">Neural patch, your printed shell, magnetic charging dock, 30 single-use gel pads and a USB-C cable.</p>
          </Card>
        </div>

        <Card className="flex flex-col gap-4">
          <Label>Order summary</Label>
          <ul>
            <Row label="DS-28 patch starter kit" value={inr(PRICING.kit)} />
            <Row label="Your printed shell" sub={`${design.shape.name}, ${finish.name}`} value={inr(PRICING.shell)} />
            <Row label={`${delivery.name} delivery`} value={delivery.fee ? inr(delivery.fee) : 'Free'} />
          </ul>
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-title text-ink">Total</span>
            <span className="metric text-ink">{inr(total)}</span>
          </div>
          <p className="-mt-2 text-caption text-muted">Includes GST. Skill streams are paid separately, by the hour, after your patch arrives.</p>

          <div>
            <Label>Pay with</Label>
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
              {PAY.map((p) => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={pay === p.id}
                  onClick={() => setPay(p.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-[12px] transition-colors ${pay === p.id ? 'border-accent bg-accent/5 text-ink' : 'border-line text-muted hover:text-ink'}`}
                >
                  <Icon name={p.icon} size={20} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary h-12 text-[15px]" onClick={place} disabled={placing}>
            {placing ? 'Placing order…' : `Place order · ${inr(total)}`}
          </button>
          <p className="text-caption text-muted">Prototype: no payment is taken and no payment details are collected.</p>
        </Card>
      </div>
    </div>
  );
}
