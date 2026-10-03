import { Play, Square, Gauge } from 'lucide-react';
import { SKILLS, MONTHLY_HOURS, cooldownHours, findSkill, formatHours, usd } from '../data.js';

const H = 3600e3;
const clock = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const hms = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

/** Rental vs subscription pricing, duration, and live stream / cooldown timers. */
export default function RentalTab({ order, onPlan, onOrder, calibrated, session, onSession, now, speed, onSpeed, onCalibrate }) {
  const { plan } = order;
  const skill = findSkill(plan.skillId);
  const hours = plan.hours;
  const monthly = plan.billing === 'monthly';
  const used = order.hoursUsed ?? 0;
  const overCap = monthly && used + hours > MONTHLY_HOURS;
  // Subscription hours past the monthly cap bill at the rental rate.
  const sessionCost = monthly ? Math.max(0, used + hours - Math.max(used, MONTHLY_HOURS)) * skill.rate : skill.rate * hours;
  const cooldown = cooldownHours(hours, skill.override);

  const streaming = session && now < session.ends;
  const cooling = session && !streaming && now < session.clears;
  const locked = streaming || cooling;

  const start = () => {
    if (locked || !calibrated) return;
    if (monthly) onOrder({ hoursUsed: used + hours });
    onSession({ skill, hours, cooldown, starts: now, ends: now + hours * H, clears: now + (hours + cooldown) * H, cost: sessionCost });
  };
  const stop = () => {
    // Ending early still enforces cooldown, scaled to the time actually streamed.
    const streamed = (now - session.starts) / H;
    onSession({ ...session, ends: now, clears: now + cooldownHours(Math.max(streamed, 0.1), session.skill.override) * H });
  };

  const phase = streaming ? 'stream' : cooling ? 'cool' : 'idle';
  const total = session ? session.clears - session.starts : 1;
  const pos = session ? Math.min(1, (now - session.starts) / total) : 0;

  return (
    <div>
      <div className="render-head">
        <div>
          <h2 className="panel-title">Stream Rental & Subscription Console</h2>
          <p className="muted small">Switch billing, set the session length, and watch the mandatory cooldown play out.</p>
        </div>
        <div className="seg compact" role="radiogroup" aria-label="Billing">
          {[['rental', 'Rental'], ['monthly', 'Subscription']].map(([id, label]) => (
            <button key={id} role="radio" aria-checked={plan.billing === id} className={plan.billing === id ? 'active' : ''} onClick={() => onPlan({ billing: id })} disabled={locked}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="skill-grid" role="radiogroup" aria-label="Skill stream">
        {SKILLS.map((s) => (
          <button key={s.id} role="radio" aria-checked={plan.skillId === s.id} className={`skill ${plan.skillId === s.id ? 'active' : ''}`} onClick={() => onPlan({ skillId: s.id })} disabled={locked}>
            <span className="skill-top">
              <b>{s.name}</b>
              <span className="mono">{monthly ? `${usd(s.monthly)}/mo` : `${usd(s.rate)}/hr`}</span>
            </span>
            <span className="override">
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15" className="ov-track" />
                <circle cx="18" cy="18" r="15" className="ov-fill" strokeDasharray={`${(s.override / 100) * 94.2} 94.2`} transform="rotate(-90 18 18)" />
              </svg>
              <span className="mono">{s.override}%</span>
              <span className="small muted">motor override</span>
            </span>
            <span className="small muted">Becomes: {s.evolves}</span>
          </button>
        ))}
      </div>

      <div className="rental-calc card-inset">
        <label className="duration">
          <span className="row-between">
            <span>Session length</span>
            <span className="mono big">{hours} h</span>
          </span>
          <input
            type="range" min="1" max="8" step="1" value={hours}
            onChange={(e) => onPlan({ hours: Number(e.target.value) })}
            style={{ '--fill': `${((hours - 1) / 7) * 100}%` }}
            aria-label="Session length in hours"
            disabled={locked}
          />
          <span className="ticks mono small muted">{[1, 2, 3, 4, 5, 6, 7, 8].map((h) => <span key={h}>{h}</span>)}</span>
        </label>

        <div className="calc-out">
          <div>
            <span className="small muted">{monthly ? 'This session' : 'Rental total'}</span>
            <b className="mono big acc">{usd(sessionCost)}</b>
            <span className="mono small muted">
              {monthly ? `${Math.min(locked ? used : used + hours, MONTHLY_HOURS)}/${MONTHLY_HOURS} h of plan${overCap && !locked ? ' · overage at hourly rate' : ''}` : `${usd(skill.rate)} × ${hours} h`}
            </span>
          </div>
          <div>
            <span className="small muted">Mandatory cooldown</span>
            <b className="mono big warn">{formatHours(cooldown)}</b>
            <span className="mono small muted">{hours} h × {skill.override}% × 1.5</span>
          </div>
          <div>
            <span className="small muted">{monthly ? 'Effective rate' : 'Subscription would be'}</span>
            <b className="mono big">{monthly ? `${usd(Math.round(skill.monthly / MONTHLY_HOURS))}/hr` : `${usd(skill.monthly)}/mo`}</b>
            <span className="small muted">{monthly ? `at ${MONTHLY_HOURS} h/month` : `breaks even at ${Math.ceil(skill.monthly / skill.rate)} h/month`}</span>
          </div>
        </div>

        <div className={`timer card-inset phase-${phase}`} aria-live="polite">
          <div className="timer-top">
            <span className="mono small">
              {phase === 'stream' ? `STREAMING · ${session.skill.name.toUpperCase()}` : phase === 'cool' ? 'BIOLOGICAL COOLDOWN · RE-STREAM LOCKED' : 'NO ACTIVE STREAM'}
            </span>
            <span className="speed mono small">
              <Gauge size={14} aria-hidden="true" />
              {[1, 60, 600].map((s) => (
                <button key={s} className={speed === s ? 'active' : ''} onClick={() => onSpeed(s)} aria-pressed={speed === s}>{s}×</button>
              ))}
            </span>
          </div>
          <b className="mono timer-big">
            {phase === 'stream' ? hms(session.ends - now) : phase === 'cool' ? hms(session.clears - now) : '00:00:00'}
          </b>
          <div className="cooldown-bar live">
            <span className="seg-stream" style={{ flex: session ? session.ends - session.starts : hours }}>STREAM</span>
            <span className="seg-cool" style={{ flex: session ? session.clears - session.ends : cooldown }}>COOLDOWN</span>
            {session && <i className="playhead" style={{ left: `${pos * 100}%` }} />}
          </div>
          <span className="small muted">
            {session
              ? `Stream ${clock(session.starts)} → ${clock(session.ends)} · clear at ${clock(session.clears)} (demo clock)`
              : `A ${hours} h stream started now clears at ${clock(now + (hours + cooldown) * H)}.`}
          </span>
        </div>

        {!calibrated ? (
          <div className="gate small">
            <span>Signal not calibrated. Streams stay locked until epidermal coupling reads READY.</span>
            <button className="btn btn-ghost small" onClick={onCalibrate}>Go to 02. Calibration</button>
          </div>
        ) : streaming ? (
          <button className="btn btn-ghost wide" onClick={stop}>
            <Square size={16} aria-hidden="true" /> End stream early (cooldown still applies)
          </button>
        ) : (
          <button className="btn btn-primary wide" onClick={start} disabled={cooling}>
            <Play size={16} aria-hidden="true" />
            {cooling ? `Cooldown: ${hms(session.clears - now)} left` : `Start ${hours} h ${skill.name} stream · ${sessionCost ? usd(sessionCost) : 'included'}`}
          </button>
        )}
      </div>
    </div>
  );
}
