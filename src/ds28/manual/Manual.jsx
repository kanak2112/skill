import { useEffect, useState } from 'react';
import { Layers, Activity, Timer, Network, ShieldAlert, RotateCcw } from 'lucide-react';
import PatchSVG from '../components/PatchSVG.jsx';
import ShellTab from './ShellTab.jsx';
import CalibrationTab from './CalibrationTab.jsx';
import RentalTab from './RentalTab.jsx';
import TopologyTab from './TopologyTab.jsx';
import SafetyTab from './SafetyTab.jsx';
import { findFinish, findNode, findSkill } from '../data.js';
import { evolvePersona } from '../persona.js';

const TABS = [
  { id: 'shell', n: '01', label: 'Shell Configurator', Icon: Layers },
  { id: 'calib', n: '02', label: 'Signal Calibration', Icon: Activity },
  { id: 'rental', n: '03', label: 'Stream & Subscription', Icon: Timer },
  { id: 'topo', n: '04', label: 'Topology Inspector', Icon: Network },
  { id: 'safety', n: '05', label: 'Safety & DRM', Icon: ShieldAlert },
];

const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');

/** Simulated clock so multi-hour streams and cooldowns can be watched at demo speed. */
function useSimClock(speed) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 250 * speed), 250);
    return () => clearInterval(id);
  }, [speed]);
  return now;
}

/** Post-purchase console. Accents derive from the bonded shell finish; state is saved on the order. */
export default function Manual({ order, onOrder, onNewShell }) {
  const [tab, setTab] = useState('shell');
  const [speed, setSpeed] = useState(60);
  const [session, setSession] = useState(null);
  const now = useSimClock(speed);
  const { design, serial, plan, persona } = order;
  const glowMode = order.glowMode ?? 'glow';
  const calibrated = !!order.calibrated;
  const finish = findFinish(design.finishId);
  const node = findNode(design.nodeId);
  const skill = findSkill(plan.skillId);
  const evolved = persona ? evolvePersona(persona, plan.skillId).title : skill.evolves;

  const streaming = session && now < session.ends;
  const cooling = session && !streaming && now < session.clears;

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
              {design.shape.name} · {finish.name} · {node.name} · {plan.billing === 'monthly' ? 'Subscription' : 'Rental'}: {skill.name}
            </p>
          </div>
        </div>
        <div className="manual-status mono small">
          <span className={`pill ${calibrated ? 'ok' : 'warn'}`}>{calibrated ? 'COUPLED' : 'UNCALIBRATED'}</span>
          <span className={`pill ${streaming ? 'ok' : cooling ? 'warn' : ''}`}>
            {streaming ? `LIVE: ${evolved.toUpperCase()}` : cooling ? 'COOLDOWN' : 'NO STREAM'}
          </span>
          <span className="pill">{glowMode === 'glow' ? 'LOAD GLOW' : 'STEALTH'}</span>
        </div>
      </header>

      <div className="manual-body">
        <nav className="manual-tabs" role="tablist" aria-label="Web Manual sections">
          {TABS.map(({ id, n, label, Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`mtab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              <span className="mono mtab-n">{n}.</span>
              <Icon size={16} aria-hidden="true" className="mtab-icon" />
              <span>{label}</span>
            </button>
          ))}
          <button className="mtab reset" onClick={onNewShell}>
            <RotateCcw size={14} aria-hidden="true" className="mtab-icon" />
            <span>Design a new shell</span>
          </button>
        </nav>

        <section key={tab} className="manual-panel card page-enter" role="tabpanel">
          {tab === 'shell' && <ShellTab order={order} mode={glowMode} onMode={(m) => onOrder({ glowMode: m })} />}
          {tab === 'calib' && <CalibrationTab node={node} calibrated={calibrated} onCalibrated={(v) => onOrder({ calibrated: v })} />}
          {tab === 'rental' && (
            <RentalTab
              order={order}
              onPlan={(p) => onOrder({ plan: { ...plan, ...p } })}
              onOrder={onOrder}
              calibrated={calibrated}
              session={session}
              onSession={setSession}
              now={now}
              speed={speed}
              onSpeed={setSpeed}
              onCalibrate={() => setTab('calib')}
            />
          )}
          {tab === 'topo' && (
            <TopologyTab
              nodeId={design.nodeId}
              calibrated={calibrated}
              streaming={!!streaming}
              onAssign={(id) => onOrder({ design: { ...design, nodeId: id }, calibrated: false })}
            />
          )}
          {tab === 'safety' && <SafetyTab serial={serial} onLockout={() => setSession(null)} />}
        </section>
      </div>
    </div>
  );
}
