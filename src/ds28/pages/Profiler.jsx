import { useRef, useState, useEffect } from 'react';
import { ScanFace, Sparkles, ArrowRight, AtSign, ShieldCheck } from 'lucide-react';
import Radar from '../components/Radar.jsx';
import { SKILLS, findSkill, planPrice, usd, MONTHLY_HOURS } from '../data.js';
import { TRAITS, analyzePersona, evolvePersona, SAMPLE_PERSONAS } from '../persona.js';

const BASELINE = {
  title: 'Unprofiled baseline',
  primary: 'Unprofiled baseline',
  traits: { precision: 40, strength: 40, endurance: 40, composure: 40, focus: 40, creativity: 40 },
  signals: [],
};

const SCAN = ['Tokenising self-description', 'Matching behavioural signals', 'Estimating motor baseline', 'Projecting augmentation fit'];

/** Step 1: persona analysis and skill plan selection with a live evolution preview. */
export default function Profiler({ persona, onPersona, plan, onPlan, onNext }) {
  const [text, setText] = useState(persona?.input ?? SAMPLE_PERSONAS[0]);
  const [step, setStep] = useState(-1);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const p = persona ?? BASELINE;
  const skill = findSkill(plan.skillId);
  const evo = evolvePersona(p, plan.skillId);

  const analyze = () => {
    if (step >= 0 || !text.trim()) return;
    SCAN.forEach((_, i) => timers.current.push(setTimeout(() => setStep(i), i * 380)));
    timers.current.push(setTimeout(() => {
      setStep(-1);
      onPersona(analyzePersona(text));
    }, SCAN.length * 380 + 200));
  };

  return (
    <div className="profiler">
      <header className="section-head page-head">
        <p className="eyebrow mono">Step 1 of 3 · Persona & skills</p>
        <h1>What kind of person will this make you?</h1>
        <p className="muted">Describe yourself or paste a handle. We profile your motor baseline, then show what each skill stream turns you into.</p>
      </header>

      <div className="profiler-grid">
        <div className="studio-col">
          <section className="card">
            <label htmlFor="persona-input" className="card-title block">Connect your web handle / AI persona summary</label>
            <div className="persona-input">
              <AtSign size={18} className="muted" aria-hidden="true" />
              <textarea
                id="persona-input"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && analyze()}
                placeholder="@handle, or a few lines about what you do"
              />
            </div>
            <div className="chips">
              {SAMPLE_PERSONAS.slice(1).map((s) => (
                <button key={s} className="chip chip-btn" onClick={() => setText(s)}>{s}</button>
              ))}
            </div>
            <button className="btn btn-primary wide" onClick={analyze} disabled={step >= 0}>
              <ScanFace size={18} aria-hidden="true" /> {step >= 0 ? `${SCAN[step]}…` : 'Analyse my profile'}
            </button>
            {step >= 0 && <div className="progress"><span style={{ width: `${((step + 1) / SCAN.length) * 100}%` }} /></div>}
            <p className="privacy small muted">
              <ShieldCheck size={14} aria-hidden="true" /> Runs on this page only. Nothing is fetched from or sent to any network.
            </p>
          </section>

          <section className={`card persona-card ${persona ? '' : 'is-empty'}`}>
            <div className="persona-head">
              <div>
                <p className="mono small muted">CURRENT PERSONA {persona?.handle ? `· ${persona.handle}` : ''}</p>
                <h3>{p.title}</h3>
                {!persona && <p className="small muted">Run the analysis to replace this neutral baseline with your own.</p>}
              </div>
            </div>
            {persona && (
              <div className="chips">
                {persona.signals.length
                  ? persona.signals.map((s) => <span key={s} className="chip mono">{s}</span>)
                  : <span className="chip mono">no keywords · inferred from writing style</span>}
              </div>
            )}
            <ul className="trait-bars">
              {TRAITS.map((t) => (
                <li key={t.id}>
                  <span className="small">{t.label}</span>
                  <span className="tbar"><span style={{ width: `${p.traits[t.id]}%` }} /></span>
                  <span className="mono small">{p.traits[t.id]}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="studio-col">
          <section className="card">
            <div className="render-head">
              <h3 className="card-title">Skill augmentation marketplace</h3>
              <div className="seg compact" role="radiogroup" aria-label="Billing">
                {[['rental', 'Rental'], ['monthly', 'Monthly']].map(([id, label]) => (
                  <button key={id} role="radio" aria-checked={plan.billing === id} className={plan.billing === id ? 'active' : ''} onClick={() => onPlan({ billing: id })}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="market">
              {SKILLS.map((s) => (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={plan.skillId === s.id}
                  className={`market-item ${plan.skillId === s.id ? 'active' : ''}`}
                  onClick={() => onPlan({ skillId: s.id })}
                >
                  <span className="market-top">
                    <b>{s.name}</b>
                    <span className="mono">
                      <span className={plan.billing === 'rental' ? 'price-on' : 'price-off'}>{usd(s.rate)}/hr</span>
                      <span className="muted"> · </span>
                      <span className={plan.billing === 'monthly' ? 'price-on' : 'price-off'}>{usd(s.monthly)}/mo</span>
                    </span>
                  </span>
                  <span className="small">Evolves you into: <b className="evo-word">{s.evolves}</b> with {s.evolvesNote}.</span>
                  <span className="mono small muted">{s.override}% motor override</span>
                </button>
              ))}
            </div>
            {plan.billing === 'rental' ? (
              <label className="duration">
                <span className="row-between">
                  <span className="small">Prepaid stream hours</span>
                  <span className="mono">{plan.hours} h · {usd(planPrice(plan))}</span>
                </span>
                <input
                  type="range" min="1" max="8" value={plan.hours}
                  onChange={(e) => onPlan({ hours: Number(e.target.value) })}
                  style={{ '--fill': `${((plan.hours - 1) / 7) * 100}%`, '--acc': '#00f0ff' }}
                  aria-label="Prepaid rental hours"
                />
              </label>
            ) : (
              <p className="small muted">Monthly plans include {MONTHLY_HOURS} stream hours, billed {usd(skill.monthly)} each month. Cancel any time from the Web Manual.</p>
            )}
          </section>

          <section className="card evolution">
            <p className="mono small muted">PERSONA EVOLUTION PREVIEW</p>
            <div className="evo-titles">
              <span className="evo-from">{p.primary}</span>
              <ArrowRight size={18} aria-hidden="true" />
              <span key={evo.title} className="evo-to">{evo.title}</span>
            </div>
            <div className="evo-body">
              <Radar base={p.traits} evolved={evo.traits} color="#00f0ff" />
              <div className="evo-stats">
                <div className="evo-gain">
                  <Sparkles size={18} aria-hidden="true" />
                  <b className="mono">+{evo.gain}%</b>
                  <span className="small muted">total capability while streaming</span>
                </div>
                <ul className="evo-deltas">
                  {TRAITS.filter((t) => evo.traits[t.id] !== p.traits[t.id]).map((t) => (
                    <li key={t.id} className="small">
                      <span>{t.label}</span>
                      <span className="mono">{p.traits[t.id]} → <b>{evo.traits[t.id]}</b></span>
                    </li>
                  ))}
                </ul>
                <p className="small muted">Boosts apply only while the stream is live. Up to 14% of the motor pattern may persist afterwards.</p>
              </div>
            </div>
            <button className="btn btn-primary wide" onClick={onNext}>
              Design my shell <ArrowRight size={18} aria-hidden="true" />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
