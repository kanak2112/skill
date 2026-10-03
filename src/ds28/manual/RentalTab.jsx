import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Card, Label, Title } from '../ui.jsx';
import { SKILLS, findSkill, fmtMinutes, inr, streamPlan } from '../data.js';

const LEVEL = {
  Low: { color: '#5BBFBA', note: 'Comfortable for most people. No extra steps needed.' },
  Medium: { color: '#F2A65A', note: 'Do the 5-minute hand reset exercise afterwards, and don’t drive during rest time.' },
  High: { color: '#E06D53', note: 'Needs someone with you during the session and three days off before the next Virtuoso stream.' },
};

const clock = (d) => d.toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit' });

/** Plan a stream (always available) and start one (needs a paired, calibrated patch). */
export default function RentalTab({ order, onOrder, onGo }) {
  const [skillId, setSkillId] = useState('master');
  const [mins, setMins] = useState(120);
  const [now, setNow] = useState(Date.now());
  const skill = findSkill(skillId);
  const plan = streamPlan(skillId, mins);
  const level = LEVEL[plan.level];
  const session = order.session;
  const live = session && now < session.ends;
  const resting = session && !live && now < session.rests;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = () => {
    const t = Date.now();
    onOrder({ session: { skillId, mins, starts: t, ends: t + mins * 60e3, rests: t + (mins + plan.rest) * 60e3 } });
  };
  const stop = () => {
    const streamed = Math.max(1, (Date.now() - session.starts) / 60e3);
    const s = findSkill(session.skillId);
    onOrder({ session: { ...session, ends: Date.now(), rests: Date.now() + streamed * s.rest * 60e3 } });
  };

  const blocker = !order.paired
    ? { text: 'Streaming starts once your patch has arrived and is paired.', go: 'order', cta: 'Track my order' }
    : !order.calibrated
      ? { text: 'Calibrate first so the stream matches your skin contact today.', go: 'setup', cta: 'Calibrate' }
      : null;
  const pct = ((mins - 30) / (480 - 30)) * 100;
  const left = (ms) => fmtMinutes(Math.max(0, Math.ceil(ms / 60e3)));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <Label>Plan a stream</Label>
        <Title className="mt-1">Choose a skill</Title>
        <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Skill">
          {SKILLS.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={skillId === s.id}
              disabled={live}
              onClick={() => setSkillId(s.id)}
              className={`rounded-lg border p-3 text-left transition-colors disabled:opacity-50 ${skillId === s.id ? 'border-accent bg-accent/5' : 'border-line hover:border-muted/50'}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-title text-ink">{s.name}</span>
                <span className="text-body tabular-nums text-ink">{inr(s.rate)}<span className="text-caption text-muted">/hr</span></span>
              </span>
              <span className="mt-1 block text-caption text-muted">{s.desc}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <label htmlFor="duration" className="text-section text-muted">How long</label>
          <span className="text-title tabular-nums text-accent">{fmtMinutes(mins)}</span>
        </div>
        <input id="duration" type="range" min="30" max="480" step="15" value={mins} disabled={live} onChange={(e) => setMins(+e.target.value)} className="ds-range mt-4" style={{ '--pct': `${pct}%` }} />
        <div className="mt-2 flex justify-between text-caption text-muted"><span>30 min</span><span>4 h</span><span>8 h</span></div>
      </Card>

      <div className="flex flex-col gap-4 lg:col-span-3">
        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Cost</Label>
              <p className="metric mt-1 text-ink">{inr(plan.cost)}</p>
              <p className="text-caption text-muted">{inr(skill.rate)} × {fmtMinutes(mins)}</p>
            </div>
            <div>
              <Label>Rest afterwards</Label>
              <p className="metric mt-1 text-ink">{fmtMinutes(plan.rest)}</p>
              <p className="text-caption text-muted">{skill.rest} h of rest per hour</p>
            </div>
            <div>
              <Label>Strain</Label>
              <p className="metric mt-1" style={{ color: level.color }}>{plan.level}</p>
              <p className="text-caption text-muted">{plan.score} out of 100</p>
            </div>
          </div>
          <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-canvas">
            <div className="bg-accent transition-all duration-500" style={{ width: `${100 / (1 + skill.rest)}%` }} />
            <div className="bg-muted/30 transition-all duration-500" style={{ width: `${(100 * skill.rest) / (1 + skill.rest)}%` }} />
          </div>
          <p className="mt-2 text-caption text-muted">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent" />Stream
            <span className="ml-4 mr-1.5 inline-block h-2 w-2 rounded-full bg-muted/50" />Rest: skilled tasks are paused, normal movement is fine
          </p>
          <p className="mt-4 rounded-lg bg-canvas p-3 text-body text-muted">
            <span className="text-ink">{level.note}</span> Strain rises with longer sessions and more complex skills. It’s guidance, not a diagnosis.
          </p>
        </Card>

        <Card>
          {live ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="flex items-center gap-2 text-teal"><span className="pulse-dot inline-block h-2 w-2 rounded-full bg-teal text-teal" /><span className="text-title">{findSkill(session.skillId).name} is streaming</span></span>
                <p className="mt-1 text-body text-muted">{left(session.ends - now)} left · ends {clock(new Date(session.ends))}</p>
              </div>
              <button className="btn-secondary" onClick={stop}><Icon name="stop_circle" size={18} /> End early</button>
            </div>
          ) : resting ? (
            <div>
              <span className="flex items-center gap-2 text-amber"><Icon name="bedtime" size={18} /><span className="text-title">Resting</span></span>
              <p className="mt-1 text-body text-muted">You can start another stream in {left(session.rests - now)}, at {clock(new Date(session.rests))}.</p>
            </div>
          ) : blocker ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-body text-muted"><Icon name="lock" size={18} />{blocker.text}</p>
              <button className="btn-secondary h-9 text-[13px]" onClick={() => onGo(blocker.go)}>{blocker.cta}</button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-body text-muted">If you start now, you’re free for skilled tasks again at <span className="text-ink">{clock(new Date(Date.now() + (mins + plan.rest) * 60e3))}</span>.</p>
              <button className="btn-primary" onClick={start}><Icon name="play_arrow" size={18} /> Start stream · {inr(plan.cost)}</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
