import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Card, Label, Locked, Title } from '../ui.jsx';
import { findNode } from '../data.js';

const PREP = [
  { t: 'Find the spot', d: 'Use the guide in “Where to wear it”. For the temple: two fingers above and slightly in front of the top of your ear.' },
  { t: 'Clear the skin', d: 'Trim hair short over a small square. Don’t shave with a blade in the 12 hours before, as it makes the patch sting.' },
  { t: 'Clean it', d: 'Wipe once with the alcohol swab from the box and let it dry for about 45 seconds. No moisturiser or makeup on the spot.' },
  { t: 'Peel the gel pad', d: 'The gel should look clear and a little sticky. If it’s cloudy, use a fresh pad.' },
  { t: 'Press the patch on', d: 'Notch toward the outer corner of your eye. Press the centre for 10 seconds, then smooth out to the edges.' },
];

const PHASES = [
  { at: 0, msg: 'Checking skin contact' },
  { at: 0.34, msg: 'Listening to your muscles' },
  { at: 0.7, msg: 'Fine-tuning timing' },
  { at: 1, msg: 'Connected. Your signal is strong.' },
];
const DURATION = 3000;

/** Hold-to-calibrate ring. Releasing early resets it; holding for 3 s locks the signal. */
function Calibration({ done, onDone }) {
  const [p, setP] = useState(done ? 1 : 0);
  const [holding, setHolding] = useState(false);
  const [aborted, setAborted] = useState(false);
  const raf = useRef(0);
  const start = useRef(0);
  const pRef = useRef(p);

  const tick = useCallback(
    (now) => {
      const v = Math.min(1, (now - start.current) / DURATION);
      pRef.current = v;
      setP(v);
      if (v < 1) raf.current = requestAnimationFrame(tick);
      else {
        setHolding(false);
        navigator.vibrate?.([30, 40, 70]);
        onDone(true);
      }
    },
    [onDone],
  );
  const begin = () => {
    if (done || holding) return;
    setAborted(false);
    setHolding(true);
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };
  const end = () => {
    if (!holding) return;
    cancelAnimationFrame(raf.current);
    setHolding(false);
    if (pRef.current < 1) {
      setAborted(true);
      pRef.current = 0;
      setP(0);
    }
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const R = 88;
  const C = 2 * Math.PI * R;
  const phase = PHASES.reduce((a, ph) => (p >= ph.at ? ph : a), PHASES[0]);

  return (
    <>
      <div className="my-6 grid place-items-center">
        <button
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            begin();
          }}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
          onKeyDown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              e.preventDefault();
              begin();
            }
          }}
          onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && end()}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={done ? 'Calibration complete' : 'Press and hold for 3 seconds to calibrate'}
          className="relative h-[220px] w-[220px] max-w-full touch-none select-none rounded-full"
        >
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" stroke="#222A38" />
            {Array.from({ length: 60 }, (_, i) => (
              <line key={i} x1="100" y1="4" x2="100" y2={i % 5 ? 8 : 11} stroke={i / 60 <= p ? '#E2B168' : '#222A38'} strokeWidth="1.2" transform={`rotate(${i * 6} 100 100)`} />
            ))}
            <circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" strokeLinecap="round" stroke={done ? '#5BBFBA' : '#E2B168'} strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
          </svg>
          <span className={`absolute inset-[26px] grid place-items-center rounded-full border border-line text-center transition-colors ${holding ? 'bg-accent/10' : 'bg-canvas'}`}>
            <span>
              <Icon name={done ? 'check_circle' : holding ? 'graphic_eq' : 'fingerprint'} size={30} className={`mx-auto ${done ? 'text-teal' : 'text-accent'}`} />
              <span className="metric mt-2 block text-ink">{done ? 'Ready' : `${Math.round(p * 100)}%`}</span>
              <span className="mt-1 block text-caption text-muted">{done ? 'Calibrated' : holding ? 'Keep holding' : 'Press and hold'}</span>
            </span>
          </span>
        </button>
      </div>
      <div className="rounded-lg border border-line bg-canvas p-3" aria-live="polite">
        <p className={`text-title ${done ? 'text-teal' : aborted ? 'text-amber' : 'text-ink'}`}>
          {aborted ? 'Released too early. Hold for the full 3 seconds.' : holding || done ? phase.msg : 'Sit still, relax your jaw, then press and hold.'}
        </p>
      </div>
      {done && (
        <button
          onClick={() => {
            pRef.current = 0;
            setP(0);
            onDone(false);
          }}
          className="btn-secondary mt-3 h-9 self-start text-[13px]"
        >
          <Icon name="restart_alt" size={16} /> Calibrate again
        </button>
      )}
    </>
  );
}

export default function SetupTab({ order, onOrder, onGo }) {
  const node = findNode(order.design.nodeId);
  const [open, setOpen] = useState(0);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <Label>About 4 minutes · once a day</Label>
        <Title className="mt-1">Prepare your skin</Title>
        <p className="mt-2 max-w-[60ch] text-body text-muted">Good skin contact is what makes streams feel smooth. Do these five steps before your first stream each day.</p>
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {PREP.map((s, i) => (
            <li key={s.t}>
              <button className="flex w-full items-center gap-3 py-3.5 text-left" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-caption tabular-nums text-accent">{i + 1}</span>
                <span className="flex-1 text-title text-ink">{s.t}</span>
                <Icon name="expand_more" size={18} className={`text-muted transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <p className="fade-in pb-4 pl-10 text-body text-muted">{s.d}</p>}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="flex flex-col lg:col-span-2">
        <Label>{node.name} · calibration</Label>
        <Title className="mt-1">Hold to calibrate</Title>
        {order.paired ? (
          <>
            <p className="mt-2 text-body text-muted">With the patch on, hold the ring for 3 seconds while you sit still.</p>
            <Calibration done={!!order.calibrated} onDone={(v) => onOrder({ calibrated: v })} />
            {order.calibrated && (
              <button className="btn-primary mt-3" onClick={() => onGo('rental')}>
                Choose a skill <Icon name="arrow_forward" size={18} />
              </button>
            )}
          </>
        ) : (
          <div className="mt-4">
            <Locked
              icon="inventory_2"
              title="Available once your patch arrives"
              action={<button className="btn-secondary h-9 text-[13px]" onClick={() => onGo('order')}>Track my order</button>}
            >
              Calibration reads your skin through the patch, so it needs the real device. Unbox it and pair it from “Your order”, then come back here.
            </Locked>
          </div>
        )}
      </Card>
    </div>
  );
}
