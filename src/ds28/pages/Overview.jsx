import PatchSVG from '../components/PatchSVG.jsx';
import { presetShape } from '../shapes.js';
import { SKILLS, NODES, PRICING, usd } from '../data.js';

const FEATURES = [
  {
    k: '28-ch',
    title: 'Surface EMG array',
    body: '28 dry graphene electrodes read motor intent through the skin. No needles, no implant, no incision.',
  },
  {
    k: '±0.4 mA',
    title: 'Closed-loop stimulation',
    body: 'Transcutaneous micro-pulses nudge the same muscle groups a licensed expert used when the stream was recorded.',
  },
  {
    k: '0.2 mm',
    title: 'Bespoke 3D shell',
    body: 'Your shell is printed to order in your own shape and coating. Worn on the temple, neck or forearm as jewellery.',
  },
];

export default function Overview({ onStudio }) {
  const hero = presetShape('anger');
  return (
    <div className="overview">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="dot on" /> Now shipping · Batch 2035.Q3
          </p>
          <h1 className="hero-title">
            Wear Your
            <br />
            <span className="glitch" data-text="Motor Intent.">Motor Intent.</span>
          </h1>
          <p className="hero-lede">
            Neural Stream™ DS-28 is a non-invasive sEMG and neural stimulation patch. Rent the hands of a
            master by the hour, then wear the hardware as a sculpted shell that is entirely your own.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={onStudio}>
              Design your shell in Shape Studio <span aria-hidden="true">→</span>
            </button>
            <span className="price-tag mono">from {usd(PRICING.core + PRICING.shell)}</span>
          </div>
          <dl className="hero-specs">
            <div><dt>Weight</dt><dd className="mono">4.1 g</dd></div>
            <div><dt>Latency</dt><dd className="mono">2.9 ms</dd></div>
            <div><dt>Battery</dt><dd className="mono">19 h</dd></div>
            <div><dt>Nodes</dt><dd className="mono">{NODES.length}</dd></div>
          </dl>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="orbit o1" />
          <div className="orbit o2" />
          <div className="orbit o3" />
          <div className="scan" />
          <PatchSVG shape={hero} color="#ff2a4b" coating="gloss" glow={1} className="hero-patch" />
          <span className="callout c1 mono">sEMG · 28ch</span>
          <span className="callout c2 mono">ECR coating · #ff2a4b</span>
          <span className="callout c3 mono">0.82 kΩ temple bond</span>
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <article key={f.title} className="card feature">
            <span className="feature-k mono">{f.k}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        ))}
      </section>

      <section className="streams-strip">
        <header className="section-head">
          <h2>Skill streams, by the hour</h2>
          <p>Licensed motor recordings from verified experts. Rent after purchase in the Web Manual.</p>
        </header>
        <div className="streams-grid">
          {SKILLS.map((s) => (
            <article key={s.id} className="card stream-card">
              <div className="stream-top">
                <h3>{s.name}</h3>
                <span className="mono rate">{usd(s.rate)}/hr</span>
              </div>
              <div className="override-bar"><span style={{ width: `${s.override}%` }} /></div>
              <p className="mono small muted">{s.override}% motor override</p>
              <p className="small">{s.blurb}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band card">
        <div>
          <h2>Your shape. Your signal.</h2>
          <p className="muted">Speak it, sketch it or upload it. Try it on the temple, neck or forearm before it prints.</p>
        </div>
        <button className="btn btn-primary" onClick={onStudio}>Open Shape Studio →</button>
      </section>
    </div>
  );
}
