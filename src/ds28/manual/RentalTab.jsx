import { useState } from 'react';
import { SKILLS, cooldownHours, findSkill, formatHours, usd } from '../data.js';

const clock = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function RentalTab({ calibrated, rental, onRent, onCalibrate }) {
  const [skillId, setSkillId] = useState(rental?.skill.id ?? 'craftsman');
  const [hours, setHours] = useState(rental?.hours ?? 2);
  const skill = findSkill(skillId);
  const total = skill.rate * hours;
  const cooldown = cooldownHours(hours, skill.override);
  const now = new Date();
  const ends = new Date(now.getTime() + hours * 3600e3);
  const clear = new Date(ends.getTime() + cooldown * 3600e3);

  return (
    <div>
      <h2 className="panel-title">Stream Rental Console</h2>
      <p className="muted small">Pick a licensed motor stream and a duration. Price and mandatory cooldown update as you go.</p>

      <div className="skill-grid" role="radiogroup" aria-label="Skill stream">
        {SKILLS.map((s) => (
          <button
            key={s.id}
            role="radio"
            aria-checked={skillId === s.id}
            className={`skill ${skillId === s.id ? 'active' : ''}`}
            onClick={() => setSkillId(s.id)}
          >
            <span className="skill-top">
              <b>{s.name}</b>
              <span className="mono">{usd(s.rate)}/hr</span>
            </span>
            <span className="override">
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15" className="ov-track" />
                <circle cx="18" cy="18" r="15" className="ov-fill" strokeDasharray={`${(s.override / 100) * 94.2} 94.2`} transform="rotate(-90 18 18)" />
              </svg>
              <span className="mono">{s.override}%</span>
              <span className="small muted">motor override</span>
            </span>
            <span className="small muted">{s.blurb}</span>
          </button>
        ))}
      </div>

      <div className="rental-calc card-inset">
        <label className="duration">
          <span className="row-between">
            <span>Duration</span>
            <span className="mono big">{hours} h</span>
          </span>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            style={{ '--fill': `${((hours - 1) / 7) * 100}%` }}
            aria-label="Rental duration in hours"
          />
          <span className="ticks mono small muted">{[1, 2, 3, 4, 5, 6, 7, 8].map((h) => <span key={h}>{h}</span>)}</span>
        </label>

        <div className="calc-out">
          <div>
            <span className="small muted">Rental total</span>
            <b className="mono big acc">{usd(total)}</b>
            <span className="mono small muted">{usd(skill.rate)} × {hours} h</span>
          </div>
          <div>
            <span className="small muted">Mandatory cooldown</span>
            <b className="mono big warn">{formatHours(cooldown)}</b>
            <span className="mono small muted">{hours} h × {skill.override}% × 1.5</span>
          </div>
          <div>
            <span className="small muted">Stream / cooldown ends</span>
            <b className="mono">{clock(ends)} → {clock(clear)}</b>
            <span className="small muted">No re-stream until cleared</span>
          </div>
        </div>

        <div className="cooldown-bar" aria-hidden="true">
          <span className="seg-stream" style={{ flex: hours }}>STREAM</span>
          <span className="seg-cool" style={{ flex: cooldown }}>BIOLOGICAL COOLDOWN</span>
        </div>

        {calibrated ? (
          <button className="btn btn-primary wide" onClick={() => onRent({ skill, hours, total, cooldown, started: now.toISOString() })}>
            {rental ? 'Update licence' : 'Authorize stream licence'} · {usd(total)}
          </button>
        ) : (
          <div className="gate small">
            <span>Signal not calibrated. Streams stay locked until epidermal coupling reads READY.</span>
            <button className="btn btn-ghost small" onClick={onCalibrate}>Go to 02. Calibration</button>
          </div>
        )}

        {rental && (
          <p className="licence small" role="status">
            <span className="dot on" /> Licensed: <b>{rental.skill.name}</b> for {rental.hours} h ({usd(rental.total)}). Cooldown{' '}
            {formatHours(rental.cooldown)} is enforced on-device.
          </p>
        )}
      </div>
    </div>
  );
}
