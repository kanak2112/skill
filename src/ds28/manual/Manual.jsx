import { useState } from 'react';
import PatchSVG from '../components/PatchSVG.jsx';
import ShellTab from './ShellTab.jsx';
import CalibrationTab from './CalibrationTab.jsx';
import RentalTab from './RentalTab.jsx';
import TopologyTab from './TopologyTab.jsx';
import SafetyTab from './SafetyTab.jsx';
import { findFinish, findNode } from '../data.js';

const TABS = [
  { id: 'shell', n: '01', label: 'Shell Configurator' },
  { id: 'calib', n: '02', label: 'Signal Calibration' },
  { id: 'rental', n: '03', label: 'Stream Rental' },
  { id: 'topo', n: '04', label: 'Topology Inspector' },
  { id: 'safety', n: '05', label: 'Safety & DRM' },
];

const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');

/** Post-purchase console. Every accent is derived from the synced shell finish. */
export default function Manual({ order, onDesign, onReset }) {
  const [tab, setTab] = useState('shell');
  const [glowMode, setGlowMode] = useState('glow');
  const [calibrated, setCalibrated] = useState(false);
  const [rental, setRental] = useState(null);
  const { design, serial } = order;
  const finish = findFinish(design.finishId);
  const node = findNode(design.nodeId);

  return (
    <div className="manual" style={{ '--acc': finish.ui, '--acc-rgb': hexRgb(finish.ui) }}>
      <header className="manual-head card">
        <div className="manual-id">
          <div className="manual-thumb">
            <PatchSVG shape={design.shape} color={finish.hex} coating={design.coating} glow={glowMode === 'glow' ? 0.8 : 0} stealth={glowMode === 'stealth'} />
          </div>
          <div>
            <p className="mono small muted">WEB MANUAL · PROFILE SYNCED</p>
            <h1 className="mono serial-head">{serial}</h1>
            <p className="small muted">
              {design.shape.name} · {finish.name} · bonded at {node.name}
            </p>
          </div>
        </div>
        <div className="manual-status mono small">
          <span className={`pill ${calibrated ? 'ok' : 'warn'}`}>{calibrated ? 'COUPLED' : 'UNCALIBRATED'}</span>
          <span className={`pill ${rental ? 'ok' : ''}`}>{rental ? `STREAM: ${rental.skill.name.toUpperCase()}` : 'NO STREAM'}</span>
          <span className="pill">{glowMode === 'glow' ? 'LOAD GLOW' : 'STEALTH'}</span>
        </div>
      </header>

      <div className="manual-body">
        <nav className="manual-tabs" role="tablist" aria-label="Web Manual sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`mtab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="mono mtab-n">{t.n}.</span>
              <span>{t.label}</span>
            </button>
          ))}
          <button className="mtab reset" onClick={onReset}>
            <span className="mono mtab-n">↺</span>
            <span>Design a new shell</span>
          </button>
        </nav>

        <section key={tab} className="manual-panel card page-enter" role="tabpanel">
          {tab === 'shell' && <ShellTab order={order} mode={glowMode} onMode={setGlowMode} />}
          {tab === 'calib' && <CalibrationTab node={node} calibrated={calibrated} onCalibrated={setCalibrated} />}
          {tab === 'rental' && (
            <RentalTab calibrated={calibrated} rental={rental} onRent={setRental} onCalibrate={() => setTab('calib')} />
          )}
          {tab === 'topo' && <TopologyTab nodeId={design.nodeId} calibrated={calibrated} onAssign={(id) => { onDesign({ nodeId: id }); setCalibrated(false); }} />}
          {tab === 'safety' && <SafetyTab serial={serial} onLockout={() => setRental(null)} />}
        </section>
      </div>
    </div>
  );
}
