import PatchSVG from '../components/PatchSVG.jsx';
import BodyPreview from '../components/BodyPreview.jsx';
import { COATINGS, findFinish, findNode } from '../data.js';

const MODES = {
  glow: { label: 'Active Load Glow', emission: '42 lm', draw: '11.8 mW', visibility: 'High', note: 'Shell pulses with stream load. Brightness tracks motor override in real time.' },
  stealth: { label: 'Stealth Mode', emission: '0 lm', draw: '6.1 mW', visibility: 'Low', note: 'Emission off, coating desaturated. Signal path is unchanged; only the jewellery goes quiet.' },
};

export default function ShellTab({ order, mode, onMode }) {
  const { design } = order;
  const finish = findFinish(design.finishId);
  const node = findNode(design.nodeId);
  const m = MODES[mode];
  const glow = mode === 'glow';

  return (
    <div className="panel-grid">
      <div>
        <h2 className="panel-title">Shell Configurator / Profile Sync</h2>
        <p className="muted small">The custom shell from your Shape Studio session, as printed and paired to this unit.</p>

        <div className={`shell-stage ${glow ? 'is-glow' : 'is-stealth'}`}>
          <div className="ring r1" />
          <div className="ring r2" />
          <PatchSVG
            className={`shell-patch ${glow ? 'pulse' : ''}`}
            shape={design.shape}
            color={finish.hex}
            coating={design.coating}
            glow={glow ? 1 : 0}
            stealth={!glow}
            title={design.shape.name}
          />
        </div>

        <div className="mode-toggle" role="radiogroup" aria-label="Shell status">
          {Object.entries(MODES).map(([id, v]) => (
            <button key={id} role="radio" aria-checked={mode === id} className={mode === id ? 'active' : ''} onClick={() => onMode(id)}>
              <span className={`led ${id}`} />
              {v.label}
            </button>
          ))}
        </div>
        <p className="small muted">{m.note}</p>
      </div>

      <div className="stack">
        <dl className="kv card-inset">
          <div><dt>Shell</dt><dd>{design.shape.name} <span className="mono muted">/{design.shape.code}</span></dd></div>
          <div><dt>Finish</dt><dd><span className="mini-chip" style={{ background: finish.hex }} />{finish.name}</dd></div>
          <div><dt>Coating</dt><dd>{COATINGS.find((c) => c.id === design.coating).name}</dd></div>
          <div><dt>Geometry</dt><dd>{design.shape.mode === 'stroke' ? 'Wire-form' : 'Solid'} · from {design.shape.source}</dd></div>
          <div><dt>Emission</dt><dd className="mono">{m.emission}</dd></div>
          <div><dt>Shell draw</dt><dd className="mono">{m.draw}</dd></div>
          <div><dt>Visibility</dt><dd>{m.visibility}</dd></div>
        </dl>
        <div className="card-inset mini-body">
          <BodyPreview shape={design.shape} color={glow ? finish.hex : '#334155'} coating={design.coating} nodeId={node.id} zoom glow={glow ? 0.9 : 0} />
          <span className="mono small muted">BONDED · {node.name.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
