import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Card, Label, Title } from '../ui.jsx';

const RISKS = [
  {
    id: 'mid',
    title: 'Your movements feel “borrowed”',
    sev: 'Serious',
    icon: 'person_off',
    body: 'After many complex streams, some people feel their own handwriting, walk or grip isn’t theirs. It affects about 1 in 340 people who stream more than 20 Virtuoso hours a month.',
    act: ['Once a week, do one task without the patch (sign your name, tie a knot) and compare it with your first week.', 'If your own movement feels strange for more than two days, stop streaming and call Clinical Support.'],
  },
  {
    id: 'pst',
    title: 'Shaky hands after a session',
    sev: 'Common',
    icon: 'vibration',
    body: 'A light tremor in the streamed hand or arm for up to 40 minutes afterwards is normal while your brain takes back control. About 1 in 5 people get it in their first month; it usually fades within 12 sessions.',
    act: ['Finish the full rest time before driving, cooking with knives or using machinery.', 'Get medical advice if the shaking lasts more than 6 hours or spreads to a limb you didn’t stream.'],
  },
  {
    id: 'umc',
    title: 'Trying to keep a skill',
    sev: 'Not allowed',
    icon: 'block',
    body: 'Skills are rented, not bought. Trying to keep one after the session, by over-rehearsing or modified software, leaves you with a movement pattern your body isn’t ready for and can injure tendons and joints.',
    act: ['The patch deletes each skill when the session ends. Don’t try to stop this.', 'Attempts are blocked straight away and reported to the skill’s owner.'],
  },
];
const SEV = { Common: '#F2A65A', Serious: '#E06D53', 'Not allowed': '#E06D53' };

function Lockout({ onClose }) {
  const [t, setT] = useState(30);
  useEffect(() => {
    const id = setInterval(() => setT((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-canvas/80 px-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="lock-title">
      <div className="fade-in w-full max-w-md rounded-2xl border border-alert/50 bg-surface p-6 shadow-2xl shadow-alert/10">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-alert/15 text-alert"><Icon name="lock" size={20} /></span>
          <div>
            <p className="text-section text-alert">Practice run</p>
            <h2 id="lock-title" className="text-screen type-screen text-ink">Stream stopped to protect you</h2>
          </div>
        </div>
        <p className="mt-4 text-body text-muted">The patch noticed an attempt to keep a rented skill after its session ended. It stopped the stream and deleted the copy.</p>
        <dl className="mt-4 grid gap-2 rounded-lg border border-line bg-canvas p-4 text-body">
          <div className="flex justify-between"><dt className="text-muted">Skill stream</dt><dd className="text-alert">Stopped</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Copied data</dt><dd className="text-teal">Deleted</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Your own movement</dt><dd className="text-teal">Not affected</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Streaming available in</dt><dd className="tabular-nums text-ink">{t > 0 ? `${t} s` : 'Now'}</dd></div>
        </dl>
        <p className="mt-3 text-caption text-muted">For real, streaming stays off for 72 hours and you’d need to check in with Clinical Support.</p>
        <button onClick={onClose} autoFocus className="btn-primary mt-5 w-full">End practice run</button>
      </div>
    </div>
  );
}

export default function SafetyTab({ order, onGlitch, onGo }) {
  const [open, setOpen] = useState('mid');
  const [modal, setModal] = useState(false);

  const run = () => {
    onGlitch(true);
    navigator.vibrate?.([120, 60, 120]);
    setTimeout(() => {
      onGlitch(false);
      setModal(true);
    }, 900);
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <Label>Read before your first stream</Label>
        <Title className="mt-1">Known risks</Title>
        <p className="mt-2 text-body text-muted">Don’t use the patch if you have a pacemaker, cochlear implant or epilepsy, or if you’re pregnant.</p>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {RISKS.map((r) => {
            const on = open === r.id;
            return (
              <div key={r.id}>
                <button onClick={() => setOpen(on ? null : r.id)} aria-expanded={on} className="flex w-full items-center gap-3 py-4 text-left">
                  <Icon name={r.icon} size={20} className="text-accent" />
                  <span className="flex-1 text-title text-ink">{r.title}</span>
                  <span className="tag hidden border sm:inline-flex" style={{ color: SEV[r.sev], borderColor: `${SEV[r.sev]}55` }}>{r.sev}</span>
                  <Icon name="expand_more" size={18} className={`text-muted transition-transform duration-300 ${on ? 'rotate-180' : ''}`} />
                </button>
                <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: on ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="pb-5 pl-8 pr-2">
                      <p className="max-w-[62ch] text-body text-muted">{r.body}</p>
                      <ul className="mt-3 flex flex-col gap-2">
                        {r.act.map((a) => (
                          <li key={a} className="flex gap-2 text-body text-ink/85"><Icon name="arrow_forward" size={16} className="mt-0.5 text-accent" />{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col lg:col-span-2">
        <Label>Copy protection</Label>
        <Title className="mt-1">See how the patch protects you</Title>
        <p className="mt-2 text-body text-muted">Each rented skill is locked to one session. Run a practice to see what happens if someone tries to keep it.</p>
        {order.paired ? (
          <button className="btn-secondary mt-5 border-alert/40 text-alert hover:bg-alert/10" onClick={run}>
            <Icon name="science" size={18} /> Run practice
          </button>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line p-3">
            <p className="flex items-center gap-2 text-caption text-muted"><Icon name="lock" size={16} />Needs your paired patch.</p>
            <button className="btn-secondary h-9 text-[13px]" onClick={() => onGo('order')}>Track my order</button>
          </div>
        )}
        <p className="mt-5 text-caption text-muted">Clinical Support, 24/7: <span className="select-all text-ink">1800 210 4242</span></p>
      </Card>
      {modal && <Lockout onClose={() => setModal(false)} />}
    </div>
  );
}
