import { useEffect, useState } from 'react';
import { NODES } from '../data.js';

const HISTORY = 32;
const jitter = (base, spread) => base + (Math.random() - 0.5) * spread;

function seed(nodeId) {
  return Object.fromEntries(
    NODES.map((n) => {
      const offset = n.id === nodeId ? 0 : 0.9;
      return [n.id, { ohm: Array.from({ length: HISTORY }, () => jitter(n.ohm + offset, 0.1)), lat: n.latency + offset * 4 }];
    }),
  );
}

function Spark({ values, lo, hi }) {
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - lo) / (hi - lo)) * 28}`).join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="spark" aria-hidden="true">
      <polyline points={pts} />
    </svg>
  );
}

/** Live impedance and latency per placement point. The bonded node reads tighter when calibrated. */
export default function TopologyTab({ nodeId, calibrated, onAssign }) {
  const [live, setLive] = useState(() => seed(nodeId));
  const [open, setOpen] = useState(nodeId);

  useEffect(() => {
    const id = setInterval(() => {
      setLive((prev) => {
        const next = {};
        NODES.forEach((n) => {
          const bonded = n.id === nodeId;
          const spread = bonded ? (calibrated ? 0.03 : 0.12) : 0.2;
          const offset = bonded ? 0 : 0.9; // unbonded sites read through air gap
          next[n.id] = {
            ohm: [...prev[n.id].ohm.slice(1), jitter(n.ohm + offset, spread)],
            lat: jitter(n.latency + (bonded ? 0 : 3.5), bonded && calibrated ? 0.2 : 0.9),
          };
        });
        return next;
      });
    }, 700);
    return () => clearInterval(id);
  }, [nodeId, calibrated]);

  return (
    <div>
      <h2 className="panel-title">Anatomical Topology Inspector</h2>
      <p className="muted small">Live readings from all three placement points. Tap a card for detail; re-assign the bond site if fit is poor.</p>

      <div className="topo-list">
        {NODES.map((n) => {
          const d = live[n.id];
          const ohm = d.ohm[d.ohm.length - 1];
          const bonded = n.id === nodeId;
          const status = bonded ? (calibrated ? 'BONDED · LOCKED' : 'BONDED · UNCALIBRATED') : 'IDLE · AIR GAP';
          const quality = Math.max(0, Math.min(100, 100 - (ohm - n.ohm) * 60 - (d.lat - n.latency) * 6));
          const expanded = open === n.id;
          return (
            <article key={n.id} className={`topo card-inset ${bonded ? 'bonded' : ''} ${expanded ? 'open' : ''}`}>
              <button className="topo-head" onClick={() => setOpen(expanded ? null : n.id)} aria-expanded={expanded}>
                <span className="topo-name">
                  <span className={`dot ${bonded ? 'on' : ''}`} />
                  <b>{n.name}</b>
                  <span className="mono small muted">{status}</span>
                </span>
                <span className="topo-read mono">
                  <span><small>IMPEDANCE</small>{ohm.toFixed(2)} kΩ</span>
                  <span><small>LATENCY</small>{d.lat.toFixed(1)} ms</span>
                </span>
                <Spark values={d.ohm} lo={n.ohm - 0.4} hi={n.ohm + 1.4} />
              </button>
              {expanded && (
                <div className="topo-detail small">
                  <dl className="kv">
                    <div><dt>Target</dt><dd>{n.target}</dd></div>
                    <div><dt>Baseline impedance</dt><dd className="mono">{n.ohm.toFixed(2)} kΩ</dd></div>
                    <div><dt>Baseline latency</dt><dd className="mono">{n.latency.toFixed(1)} ms</dd></div>
                    <div><dt>Field depth</dt><dd className="mono">{n.depth}</dd></div>
                    <div><dt>Signal quality</dt><dd><span className="qbar"><span style={{ width: `${quality}%` }} /></span> <span className="mono">{quality.toFixed(0)}%</span></dd></div>
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
