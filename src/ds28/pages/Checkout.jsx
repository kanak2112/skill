import { useEffect, useRef, useState } from 'react';
import PatchSVG from '../components/PatchSVG.jsx';
import { COATINGS, PRICING, findFinish, findNode, usd } from '../data.js';
import { makeSerial } from '../shapes.js';

const STEPS = ['Allocating hardware serial', 'Queuing bespoke shell print', 'Encrypting placement profile', 'Syncing to Web Manual'];

export default function Checkout({ design, order, onEdit, onConfirm, onManual }) {
  const [step, setStep] = useState(-1);
  const [receipt, setReceipt] = useState(null);
  const timers = useRef([]);
  const finish = findFinish(design.finishId);
  const node = findNode(design.nodeId);
  const total = PRICING.core + PRICING.shell;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const confirm = () => {
    if (step >= 0) return;
    STEPS.forEach((_, i) => timers.current.push(setTimeout(() => setStep(i), i * 420)));
    timers.current.push(
      setTimeout(() => {
        const next = {
          serial: makeSerial(design.shape.code),
          design: { ...design, shape: { ...design.shape } },
          total,
          placedAt: new Date().toISOString(),
        };
        onConfirm(next);
        setReceipt(next);
        setStep(-1);
      }, STEPS.length * 420 + 250),
    );
  };

  return (
    <div className="checkout">
      <header className="section-head page-head">
        <p className="eyebrow mono">03 / Cart & Sync</p>
        <h1>Confirm and sync your unit</h1>
        <p className="muted">One DS-28 unit, printed to your design. Your shell profile syncs to the Web Manual on confirmation.</p>
      </header>

      <div className="checkout-grid">
        <section className="card cart-item" style={{ '--acc': finish.ui }}>
          <div className="cart-visual">
            <PatchSVG shape={design.shape} color={finish.hex} coating={design.coating} glow={0.6} />
          </div>
          <div className="cart-spec">
            <p className="mono small muted">SHELL / {design.shape.code}</p>
            <h3>{design.shape.name}</h3>
            <dl className="spec-list small">
              <div><dt>Finish</dt><dd><span className="mini-chip" style={{ background: finish.hex }} />{finish.name}</dd></div>
              <div><dt>Coating</dt><dd>{COATINGS.find((c) => c.id === design.coating).name}</dd></div>
              <div><dt>Bond site</dt><dd>{node.name} · <span className="mono">{node.ohm.toFixed(2)} kΩ</span></dd></div>
              <div><dt>Source</dt><dd className="mono">{design.shape.source}</dd></div>
            </dl>
            <button className="btn btn-ghost small" onClick={onEdit} disabled={step >= 0}>Edit in Shape Studio</button>
          </div>
        </section>

        <section className="card summary">
          <h3 className="card-title">Order summary</h3>
          <ul className="lines">
            <li><span>Core Hardware<small>DS-28 sEMG / stim module, 28-ch</small></span><span className="mono">{usd(PRICING.core)}</span></li>
            <li><span>Bespoke 3D Shell Print<small>{design.shape.name}, {finish.name}</small></span><span className="mono">{usd(PRICING.shell)}</span></li>
            <li className="muted"><span>Clinical-grade shipping</span><span className="mono">$0</span></li>
          </ul>
          <div className="total-row">
            <span>Total</span>
            <span className="mono total">{usd(total)}</span>
          </div>

          {!receipt && (
            <>
              <button className="btn btn-primary wide" onClick={confirm} disabled={step >= 0}>
                {step >= 0 ? `${STEPS[step]}…` : 'Confirm Order'}
              </button>
              {step >= 0 && (
                <ol className="sync-steps mono small">
                  {STEPS.map((s, i) => (
                    <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>{s}</li>
                  ))}
                </ol>
              )}
              {order && step < 0 && (
                <p className="small muted">
                  Unit <span className="mono">{order.serial}</span> is already synced. Confirming again issues a new unit and replaces it.
                </p>
              )}
            </>
          )}

          {receipt && (
            <div className="receipt">
              <p className="mono small muted">ORDER CONFIRMED · HARDWARE SERIAL</p>
              <p className="serial mono">{receipt.serial}</p>
              <p className="small">
                Shell profile synced. Your Web Manual has auto-themed to <b>{finish.name}</b> with the {design.shape.name} shell
                bonded at the {node.name}.
              </p>
              <button className="btn btn-primary wide" onClick={onManual}>Open Web Manual →</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
