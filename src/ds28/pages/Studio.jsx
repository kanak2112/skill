import { useState } from 'react';
import PatchSVG from '../components/PatchSVG.jsx';
import BodyPreview from '../components/BodyPreview.jsx';
import VoiceInput from '../components/VoiceInput.jsx';
import SketchInput from '../components/SketchInput.jsx';
import ImageInput from '../components/ImageInput.jsx';
import { FINISHES, COATINGS, NODES, PRICING, findFinish, findNode, usd } from '../data.js';

const MODES = [
  { id: 'voice', label: 'Voice Prompt', n: 'A' },
  { id: 'sketch', label: 'Sketch Canvas', n: 'B' },
  { id: 'image', label: 'Image Reference', n: 'C' },
];

export default function Studio({ design, onChange, onCart }) {
  const [mode, setMode] = useState('voice');
  const [zoom, setZoom] = useState(true);
  const finish = findFinish(design.finishId);
  const node = findNode(design.nodeId);

  return (
    <div className="studio">
      <header className="section-head page-head">
        <p className="eyebrow mono">02 / Shape Studio</p>
        <h1>Sculpt your shell</h1>
        <p className="muted">Three ways in. Every change re-renders the shell and the try-on preview in real time.</p>
      </header>

      <div className="studio-grid">
        <div className="studio-col">
          <section className="card">
            <div className="tabs" role="tablist" aria-label="Generation input">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={mode === m.id}
                  className={`tab ${mode === m.id ? 'active' : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  <span className="mono tab-n">{m.n}</span> {m.label}
                </button>
              ))}
            </div>
            <div className="tab-body">
              {mode === 'voice' && <VoiceInput design={design} onChange={onChange} />}
              {mode === 'sketch' && <SketchInput design={design} onChange={onChange} />}
              {mode === 'image' && <ImageInput design={design} onChange={onChange} />}
            </div>
          </section>

          <section className="card">
            <h3 className="card-title">Material & coating finish</h3>
            <div className="swatches" role="radiogroup" aria-label="Finish colour">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  role="radio"
                  aria-checked={design.finishId === f.id}
                  className={`swatch ${design.finishId === f.id ? 'active' : ''}`}
                  style={{ '--sw': f.hex, '--sw-ui': f.ui }}
                  onClick={() => onChange({ finishId: f.id })}
                >
                  <span className="swatch-chip" />
                  <span className="swatch-name">{f.name}</span>
                  <span className="mono small muted">{f.hex}</span>
                </button>
              ))}
            </div>
            <div className="seg" role="radiogroup" aria-label="Coating">
              {COATINGS.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={design.coating === c.id}
                  className={design.coating === c.id ? 'active' : ''}
                  onClick={() => onChange({ coating: c.id })}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="studio-col">
          <section className="card render-card" style={{ '--acc': finish.ui }}>
            <div className="render-head">
              <div>
                <p className="mono small muted">SHELL / {design.shape.code}</p>
                <h3>{design.shape.name}</h3>
              </div>
              <span className="chip mono">{design.shape.source}</span>
            </div>
            <div className="render-stage">
              <div className="render-grid" />
              <PatchSVG
                key={design.shape.d}
                className="render-patch"
                shape={design.shape}
                color={finish.hex}
                coating={design.coating}
                glow={0.7}
                title={`${design.shape.name} in ${finish.name}`}
              />
            </div>
            <dl className="render-meta mono small">
              <div><dt>Finish</dt><dd>{finish.name}</dd></div>
              <div><dt>Coating</dt><dd>{COATINGS.find((c) => c.id === design.coating).name}</dd></div>
              <div><dt>Print</dt><dd>{design.shape.mode === 'stroke' ? 'Wire-form' : 'Solid'} · 0.2 mm</dd></div>
            </dl>
          </section>

          <section className="card tryon-card">
            <div className="render-head">
              <h3 className="card-title">Anatomical try-on</h3>
              <button className="btn btn-ghost small" onClick={() => setZoom((z) => !z)}>
                {zoom ? 'Full body' : 'Close-up'}
              </button>
            </div>
            <div className="tryon">
              <div className="tryon-stage">
                <BodyPreview
                  shape={design.shape}
                  color={finish.hex}
                  coating={design.coating}
                  nodeId={design.nodeId}
                  zoom={zoom}
                  onNode={(id) => onChange({ nodeId: id })}
                />
                <span className="tryon-label mono small">{node.name.toUpperCase()} · {node.ohm.toFixed(2)} kΩ</span>
              </div>
              <div className="node-list" role="radiogroup" aria-label="Placement node">
                {NODES.map((n) => (
                  <button
                    key={n.id}
                    role="radio"
                    aria-checked={design.nodeId === n.id}
                    className={`node-toggle ${design.nodeId === n.id ? 'active' : ''}`}
                    onClick={() => onChange({ nodeId: n.id })}
                  >
                    <span className="node-name">{n.name}</span>
                    <span className="mono node-ohm">{n.ohm.toFixed(2)} kΩ</span>
                    <span className="small muted">{n.target}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="studio-cta card">
            <div>
              <p className="mono small muted">CORE + BESPOKE SHELL</p>
              <p className="studio-total mono">{usd(PRICING.core + PRICING.shell)}</p>
            </div>
            <button className="btn btn-primary" onClick={onCart}>Continue to Cart & Sync →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
