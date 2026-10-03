import { useEffect, useRef, useState } from 'react';
import { Link2, Pencil } from 'lucide-react';
import PatchSVG from '../components/PatchSVG.jsx';
import { COATINGS, PRICING, findFinish, findNode, findSkill, planLabel, planPrice, usd } from '../data.js';
import { makeSerial } from '../shapes.js';
import { evolvePersona } from '../persona.js';

const STEPS = ['Allocating hardware serial', 'Queuing bespoke shell print', 'Bonding shell to electrode array', 'Encrypting persona & plan profile', 'Unlocking Web Manual'];

/** Step 3: order summary and "Confirm & Bond Shell". */
export default function Checkout({ design, plan, persona, order, onEdit, onConfirm, onManual }) {
  const [step, setStep] = useState(-1);
  const [receipt, setReceipt] = useState(null);
  const timers = useRef([]);
  const finish = findFinish(design.finishId);
  const node = findNode(design.nodeId);
  const skill = findSkill(plan.skillId);
  const planCost = planPrice(plan);
  const total = PRICING.core + PRICING.shell + planCost;
  const evolvesInto = persona ? evolvePersona(persona, plan.skillId).title : skill.evolves;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const confirm = () => {
    if (step >= 0) return;
    STEPS.forEach((_, i) => timers.current.push(setTimeout(() => setStep(i), i * 380)));
    timers.current.push(
      setTimeout(() => {
        const next = {
          serial: makeSerial(design.shape.code),
          design: { ...design, shape: { ...design.shape } },
          plan: { ...plan },
          persona,
          total,
          placedAt: new Date().toISOString(),
        };
        onConfirm(next);
        setReceipt(next);
        setStep(-1);
      }, STEPS.length * 380 + 250),
    );
  };

  return (
    <div className="checkout">
      <header className="section-head page-head">
        <p className="eyebrow mono">Step 3 of 3 · Checkout</p>
        <h1>Confirm & bond your shell</h1>
        <p className="muted">One DS-28 unit, printed to your design, with your skill plan attached. Bonding issues the hardware ID and unlocks the Web Manual.</p>
      </header>

      <div className="checkout-grid">
        <div className="studio-col">
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
              <button className="btn btn-ghost small" onClick={() => onEdit('studio')} disabled={step >= 0}>
                <Pencil size={14} aria-hidden="true" /> Edit shell
              </button>
            </div>
          </section>

          <section className="card plan-card">
            <div className="render-head">
              <div>
                <p className="mono small muted">SKILL PLAN</p>
                <h3>{skill.name}</h3>
              </div>
              <span className="chip mono">{plan.billing === 'monthly' ? 'SUBSCRIPTION' : 'RENTAL'}</span>
            </div>
            <p className="small">
              {persona ? <>From <b>{persona.primary}</b> to </> : 'Evolves you into '}
              <b className="evo-word">{evolvesInto}</b> with {skill.evolvesNote}.
            </p>
            <button className="btn btn-ghost small" onClick={() => onEdit('profile')} disabled={step >= 0}>
              <Pencil size={14} aria-hidden="true" /> Change plan
            </button>
          </section>
        </div>

        <section className="card summary">
          <h3 className="card-title">Order summary</h3>
          <ul className="lines">
            <li><span>Core Unit<small>DS-28 sEMG / stim module, 28-ch array</small></span><span className="mono">{usd(PRICING.core)}</span></li>
            <li><span>Bespoke 3D Shell Print<small>{design.shape.name}, {finish.name}</small></span><span className="mono">{usd(PRICING.shell)}</span></li>
            <li>
              <span>Skill plan<small>{planLabel(plan)}{plan.billing === 'monthly' ? ' · first month' : ` · ${usd(skill.rate)}/hr`}</small></span>
              <span className="mono">{usd(planCost)}</span>
            </li>
            <li className="muted"><span>Clinical-grade shipping</span><span className="mono">$0</span></li>
          </ul>
          <div className="total-row">
            <span>Due today</span>
            <span className="mono total">{usd(total)}</span>
          </div>
          {plan.billing === 'monthly' && <p className="small muted">Then {usd(skill.monthly)}/mo for the subscription. Hardware is a one-time purchase.</p>}

          {!receipt && (
            <>
              <button className="btn btn-primary wide bond-btn" onClick={confirm} disabled={step >= 0}>
                <Link2 size={18} aria-hidden="true" /> {step >= 0 ? `${STEPS[step]}…` : 'Confirm & Bond Shell'}
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
                  Unit <span className="mono">{order.serial}</span> is already bonded. Confirming again issues a new unit and replaces it.
                </p>
              )}
            </>
          )}

          {receipt && (
            <div className="receipt">
              <p className="mono small muted">SHELL BONDED · HARDWARE ID</p>
              <p className="serial mono">{receipt.serial}</p>
              <p className="small">
                Your Web Manual is unlocked and themed to <b>{finish.name}</b>, with the {design.shape.name} shell on the {node.name} and your {skill.name} {plan.billing === 'monthly' ? 'subscription' : 'rental'} loaded.
              </p>
              <button className="btn btn-primary wide" onClick={onManual}>Open Web Manual →</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
