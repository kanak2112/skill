import { useEffect, useState } from 'react';

const RISKS = [
  ['Contraindications', 'Do not use with implanted pacemakers, cochlear implants, deep-brain stimulators, epilepsy, or during pregnancy.'],
  ['Motor override', 'Streams above 90% override can execute movements faster than conscious veto. Never operate vehicles or machinery you are not licensed for.'],
  ['Biological cooldown', 'Cooldown is enforced on-device. Repeated override without recovery risks proprioceptive drift and tendon microtrauma.'],
  ['Skin', 'Stop use on redness lasting over 2 h, blistering or numbness. Rotate bond sites every 72 h of cumulative wear.'],
  ['Skill residue', 'Up to 14% of streamed motor patterns may persist after a session. Residue is not a licence to practise.'],
];

/** Clinical disclaimers plus a simulated sub-dermal DRM lockout. */
export default function SafetyTab({ serial, onLockout }) {
  const [ack, setAck] = useState(false);
  const [lock, setLock] = useState(null);

  useEffect(() => {
    if (!lock || lock.left <= 0) return;
    const id = setTimeout(() => setLock((l) => ({ ...l, left: l.left - 1 })), 1000);
    return () => clearTimeout(id);
  }, [lock]);

  useEffect(() => {
    if (!lock) return;
    const onKey = (e) => e.key === 'Escape' && lock.left <= 0 && setLock(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lock]);

  const trigger = () => {
    onLockout();
    navigator.vibrate?.([120, 60, 120, 60, 300]);
    setLock({ left: 8, code: `DRM-0x${Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0')}` });
  };

  return (
    <div>
      <h2 className="panel-title">Safety & DRM Interlock</h2>
      <p className="muted small">Read before every first stream of the day. Clinical class IIb (fictional), 2035 Neural Licensing Accord.</p>

      <ul className="risks">
        {RISKS.map(([k, v]) => (
          <li key={k} className="card-inset">
            <span className="risk-k mono small">{k.toUpperCase()}</span>
            <p className="small">{v}</p>
          </li>
        ))}
      </ul>

      <label className="ack small">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        I understand that motor streams are licensed, not owned, and that caching, recording or replaying a stream
        triggers an on-device lockout.
      </label>

      <div className="drm card-inset">
        <div>
          <p className="mono small drm-k">DRM INTERLOCK · {serial}</p>
          <p className="small muted">
            The patch verifies every streamed frame against a rotating licence key. Attempting to cache signal locally
            severs stimulation within 40 ms.
          </p>
        </div>
        <button className="btn btn-danger" onClick={trigger} disabled={!ack}>
          Simulate Sub-Dermal DRM Lockout
        </button>
      </div>

      {lock && (
        <div className="lockout" role="alertdialog" aria-modal="true" aria-labelledby="lock-title">
          <div className="lockout-scan" aria-hidden="true" />
          <div className="lockout-box">
            <p className="mono small">SECURITY INTERLOCK · {lock.code}</p>
            <h2 id="lock-title" className="lockout-title">Signal caching violation</h2>
            <p>
              Unlicensed local buffering of a motor stream was detected on <b className="mono">{serial}</b>. Stimulation has been
              severed and the active licence revoked. The patch is safe to remove.
            </p>
            <ul className="mono small lockout-log">
              <li>[00.000] frame hash mismatch · ch 07, 11, 19</li>
              <li>[00.012] sub-dermal buffer write blocked</li>
              <li>[00.038] stimulation rail → 0.0 mA</li>
              <li>[00.040] licence revoked · incident filed with NLA registry</li>
            </ul>
            <button className="btn btn-light" onClick={() => setLock(null)} disabled={lock.left > 0} autoFocus>
              {lock.left > 0 ? `Interlock engaged · ${lock.left}s` : 'Acknowledge & restore console'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
