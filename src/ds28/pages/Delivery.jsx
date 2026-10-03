import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Card, Label, PageHead } from '../ui.jsx';
import { DELIVERY, INDIAN_STATES, deliveryWindow, inr, shortDate, validateAddress } from '../data.js';

const FIELDS = [
  { id: 'name', label: 'Full name', auto: 'name', span: 2 },
  { id: 'phone', label: 'Mobile number', auto: 'tel-national', type: 'tel', inputMode: 'numeric', hint: 'The courier calls this number on delivery day.', prefix: '+91' },
  { id: 'pin', label: 'PIN code', auto: 'postal-code', inputMode: 'numeric', maxLength: 6 },
  { id: 'line1', label: 'Flat, house number, building', auto: 'address-line1', span: 2 },
  { id: 'line2', label: 'Area, street, landmark (optional)', auto: 'address-line2', span: 2, optional: true },
  { id: 'city', label: 'City or town', auto: 'address-level2' },
];

/** Step 2: where to send it, and how fast. */
export default function Delivery({ address, onAddress, deliveryId, onDelivery, onBack, onNext }) {
  const [a, setA] = useState(address ?? { name: '', phone: '', pin: '', line1: '', line2: '', city: '', state: '' });
  const [touched, setTouched] = useState({});
  const [tried, setTried] = useState(false);
  const errors = validateAddress(a);
  const show = (id) => (tried || touched[id]) && errors[id];

  const set = (id, v) => setA((x) => ({ ...x, [id]: v }));
  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length) {
      document.getElementById(`addr-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    onAddress(a);
    onNext();
  };

  const input = 'h-11 w-full rounded-lg border bg-canvas px-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent/70';

  return (
    <div className="fade-in">
      <PageHead step="Step 2 of 3" title="Where should we deliver it?">
        Your patch ships after your shell is printed and checked. We only use this address and number for this delivery.
      </PageHead>

      <form onSubmit={submit} noValidate className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <Label>Delivery address</Label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.id} className={f.span === 2 ? 'sm:col-span-2' : ''}>
                <label htmlFor={`addr-${f.id}`} className="mb-1.5 block text-[13px] text-ink">{f.label}</label>
                <div className="relative">
                  {f.prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-muted">{f.prefix}</span>}
                  <input
                    id={`addr-${f.id}`}
                    type={f.type ?? 'text'}
                    inputMode={f.inputMode}
                    autoComplete={f.auto}
                    maxLength={f.maxLength}
                    value={a[f.id]}
                    onChange={(e) => set(f.id, f.inputMode === 'numeric' ? e.target.value.replace(/[^\d ]/g, '') : e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, [f.id]: true }))}
                    aria-invalid={!!show(f.id)}
                    aria-describedby={show(f.id) ? `err-${f.id}` : f.hint ? `hint-${f.id}` : undefined}
                    className={`${input} ${f.prefix ? 'pl-12' : ''} ${show(f.id) ? 'border-alert' : 'border-line'}`}
                  />
                </div>
                {show(f.id) ? (
                  <p id={`err-${f.id}`} className="mt-1.5 text-caption text-alert">{errors[f.id]}</p>
                ) : (
                  f.hint && <p id={`hint-${f.id}`} className="mt-1.5 text-caption text-muted">{f.hint}</p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="addr-state" className="mb-1.5 block text-[13px] text-ink">State or union territory</label>
              <div className="relative">
                <select
                  id="addr-state"
                  autoComplete="address-level1"
                  value={a.state}
                  onChange={(e) => set('state', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                  aria-invalid={!!show('state')}
                  className={`${input} appearance-none pr-9 ${show('state') ? 'border-alert' : 'border-line'} ${a.state ? '' : 'text-muted'}`}
                >
                  <option value="">Choose…</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <Icon name="expand_more" size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
              {show('state') && <p className="mt-1.5 text-caption text-alert">{errors.state}</p>}
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <Label>Delivery speed</Label>
            <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label="Delivery speed">
              {DELIVERY.map((d) => {
                const [from, to] = deliveryWindow(d.id);
                const on = deliveryId === d.id;
                return (
                  <button
                    type="button"
                    key={d.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => onDelivery(d.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${on ? 'border-accent bg-accent/5' : 'border-line hover:border-muted/50'}`}
                  >
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? 'border-accent' : 'border-muted/60'}`}>
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-2">
                        <span className="text-title text-ink">{d.name}</span>
                        <span className="text-title text-ink">{d.fee ? inr(d.fee) : 'Free'}</span>
                      </span>
                      <span className="mt-0.5 block text-caption text-muted">
                        Arrives {d.days[0] === d.days[1] ? shortDate(from) : `${shortDate(from)} – ${shortDate(to)}`} · {d.note}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <p className="flex gap-2 text-caption text-muted">
              <Icon name="inventory_2" size={16} className="text-accent" />
              Your patch can’t be used until it arrives. Calibration and skill streaming unlock in your Web Manual once you’ve unboxed and paired it.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={onBack}>
                <Icon name="arrow_back" size={18} /> Back
              </button>
              <button type="submit" className="btn-primary flex-1">
                Review order <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
