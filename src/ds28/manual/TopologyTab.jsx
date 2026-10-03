import { useEffect, useState } from 'react';
import { Cpu, Radio, Zap } from 'lucide-react';
import { NODES } from '../data.js';

const HISTORY = 32;
const CHANNELS = 28;
const jitter = (base, spread) => base + (Math.random() - 0.5) * spread;

/** Expected readings per node: bonded + calibrated reads tight, bonded alone is noisy, others read air gap. */
function model(n, bonded, calibrated, streaming) {
  if (!bonded) return { ohm: n.ohm + 0.9, ohmSpread: 0.2, lat: n.latency + 3.5, snr: 3.5, seats: 2 };
  if (!calibrated) return { ohm: n.ohm + 0.35, ohmSpread: 0.14, lat: n.latency + 1.2, snr: 14, seats: 20 };
  return { ohm: n.ohm, ohmSpread: 0.03, lat: n.latency, snr: streaming ? 33 : 31, seats: CHANNELS };
}

function sample(n, m, prev) {
  const seats = Math.max(0, Math.min(CHANNELS, Math.round(jitter(m.seats, m.seats === CHANNELS ? 0 : 3))));
  return {
    ohm: [...(prev?.ohm ?? Array.from({ length: HISTORY }, () => jitter(m.ohm, m.ohmSpread))).slice(1), jitter(m.ohm, m.ohmSpread)],
    lat: jitter(m.lat, m.seats === CHANNELS ? 0.2 : 0.9),
    snr: jitter(m.snr, m.seats === CHANNELS ? 0.6 : 2.4),
    seated: Array.from({ length: CHANNELS }, (_, i) => i < seats).sort(() => (m.seats === CHANNELS ? 0 : Math.random() - 0.5)),
  };
}

function Spark({ values, lo, hi }) {
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - lo) / (hi - lo)) * 28}`).join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="spark" aria-hidden="true">
      <polyline points={`0,32 ${pts} 100,32`} className="spark-area" />
      <polyline points={pts} />
    </svg>
  );
}

/** Live impedance, electrode seating (28-ch), SNR and latency per placement node. */
export default function TopologyTab({ nodeId, calibrated, streaming, onAssign }) {
  const read = (prev) => Object.fromEntries(NODES.map((n) => [n.id, sample(n, model(n, n.id === nodeId, calibrated, streaming), prev?.[n.id])]));
  const [live, setLive] = useState(() => read());
  const [open, setOpen] = useState(nodeId);

  useEffect(() => {
    const id = setInterval(() => setLive((prev) => read(prev)), 700);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, calibrated, streaming]);

  return (
    <div>
      <h2 className="panel-title">Anatomical Topology Inspector</h2>
      <p className="muted small">Live readings from all three placement points. Tap a card for its 28-channel electrode map and detail.</p>

      <div className="topo-list">
        {NODES.map((n) => {
          const d = live[n.id];
          const ohm = d.ohm[d.ohm.length - 1];
          const seats = d.seated.filter(Boolean).length;
          const bonded = n.id === nodeId;
          const status = bonded ? (calibrated ? (streaming ? 'BONDED · STREAMING' : 'BONDED · LOCKED') : 'BONDED · UNCALIBRATED') : 'IDLE · AIR GAP';
          const snrState = d.snr >= 24 ? 'ok' : d.snr >= 10 ? 'warn' : 'bad';
          const expanded = open === n.id;
          return (
            <article key={n.id} className={`topo card-inset ${bonded ? 'bonded' : ''}`}>
              <button className="topo-head" onClick={() => setOpen(expanded ? null : n.id)} aria-expanded={expanded}>
                <span className="topo-name">
                  <span className={`dot ${bonded ? 'on' : ''}`} />
                  <b>{n.name}</b>
                  <span className="mono small muted">{status}</span>
                </span>
                <span className="topo-read mono">
                  <span><small><Zap size={10} aria-hidden="true" /> IMPEDANCE</small>{ohm.toFixed(2)} kΩ</span>
                  <span><small><Cpu size={10} aria-hidden="true" /> SEATED</small>{seats}/{CHANNELS}</span>
                  <span className={`snr ${snrState}`}><small><Radio size={10} aria-hidden="true" /> SNR</small>{d.snr.toFixed(1)} dB</span>
                </span>
                <Spark values={d.ohm} lo={n.ohm - 0.4} hi={n.ohm + 1.4} />
              </button>
              {expanded && (
                <div className="topo-detail small">
                  <div className="electrodes" role="img" aria-label={`${seats} of ${CHANNELS} electrodes seated`}>
                    {d.seated.map((on, i) => <span key={i} className={on ? 'on' : ''} title={`ch ${String(i + 1).padStart(2, '0')}`} />)}
                  </div>
                  <dl className="kv">
                    <div><dt>Target</dt><dd>{n.target}</dd></div>
                    <div><dt>Baseline impedance</dt><dd className="mono">{n.ohm.toFixed(2)} kΩ</dd></div>
                    <div><dt>Signal latency</dt><dd className="mono">{d.lat.toFixed(1)} ms</dd></div>
                    <div><dt>Field depth</dt><dd className="mono">{n.depth}</dd></div>
                    <div><dt>SNR floor for streaming</dt><dd className="mono">24 dB</dd></div>
                  </dl>
                  {!bonded && (
                    <button className="btn btn-ghost small" onClick={() => onAssign(n.id)}>
                      Re-assign shell to {n.short} (requires recalibration)
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
