import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PatchSVG from '../components/PatchSVG.jsx';
import { Card, Label, Title } from '../ui.jsx';
import { PRICING, findFinish, inr } from '../data.js';

const PARTS = [
  { n: '01', name: 'Your printed shell', spec: 'Custom 3D-printed cover · clips on', note: 'The shell you designed. It snaps over the patch and can be swapped for a new design any time.' },
  { n: '02', name: 'Sweat seal', spec: 'Waterproof to 1.5 m for 30 min', note: 'A soft silicone ring keeps sweat and shower water out, so you can wear it for days.' },
  { n: '03', name: 'Signal processor', spec: 'Bluetooth · processes on the patch', note: 'Your signals are processed on the patch itself, so raw data never leaves it.' },
  { n: '04', name: 'Battery', spec: '14 hours of streaming', note: 'Non-flammable cell. Charges to 80% in 25 minutes on the magnetic dock.' },
  { n: '05', name: 'Vibration cues', spec: 'Gentle taps for guidance', note: 'Taps against the skin to guide calibration and warn you if a stream stops.' },
  { n: '06', name: 'Skin-safe base', spec: 'Medical-grade plastic', note: 'Stays at skin temperature and is tested for long contact with skin.' },
  { n: '07', name: 'Sensor ring', spec: '16 gold-plated contacts', note: 'Sixteen small contacts in a ring read the tiny electrical signals from your muscles.' },
  { n: '08', name: 'Gel pad', spec: 'Single use · 12 hours', note: 'A fresh pad each day keeps contact steady without drying out.' },
];
const BOX = [
  ['DS-28 patch', 'With your shell fitted', 'radio_button_checked'],
  ['Magnetic dock', 'USB-C powered', 'battery_charging_full'],
  ['30 gel pads', 'Single use, 12 hours each', 'layers'],
  ['USB-C cable', '1 m braided', 'cable'],
];

export default function HardwareTab({ order }) {
  const [sel, setSel] = useState('01');
  const p = PARTS.find((x) => x.n === sel);
  const finish = findFinish(order.design.finishId);
  const W = 260;
  const H = 420;
  const gap = 46;
  const top = 34;

  return (
    <div className="grid gap-4">
      <div className="grid items-start gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <Label>Inside the patch, layer by layer</Label>
          <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto mt-4 w-full max-w-[300px]" role="group" aria-label="Exploded view of the patch">
            <path d={`M130 ${top - 10} V${top + gap * 7 + 20}`} stroke="#222A38" strokeDasharray="2 3" fill="none" />
            {PARTS.map((pt, i) => {
              const y = top + i * gap;
              const on = pt.n === sel;
              const rx = i === 7 ? 54 : i === 1 ? 62 : 58;
              return (
                <g key={pt.n} role="button" tabIndex="0" aria-pressed={on} aria-label={pt.name} onClick={() => setSel(pt.n)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(pt.n))} style={{ cursor: 'pointer', outline: 'none' }}>
                  <ellipse cx="130" cy={y + 5} rx={rx} ry="13" fill="#090D14" stroke={on ? '#E2B168' : '#222A38'} />
                  <ellipse cx="130" cy={y} rx={rx} ry="13" fill={i === 0 ? `${finish.hex}22` : i === 7 ? '#E2B16814' : '#131924'} stroke={on ? '#E2B168' : '#8E9BAE'} strokeOpacity={on ? 1 : 0.5} strokeWidth={on ? 1.6 : 1} />
                  {i === 0 && <PatchSVG shape={order.design.shape} color={finish.hex} coating={order.design.coating} x="116" y={y - 13} width="28" height="26" preserveAspectRatio="xMidYMid meet" />}
                  {i === 6 && Array.from({ length: 16 }, (_, k) => {
                    const a = (k / 16) * Math.PI * 2;
                    return <circle key={k} cx={130 + Math.cos(a) * 40} cy={y + Math.sin(a) * 8} r="1.6" fill="#E2B168" opacity={on ? 1 : 0.6} />;
                  })}
                  <line x1={130 + rx} y1={y} x2="214" y2={y} stroke={on ? '#E2B168' : '#222A38'} />
                  <text x="220" y={y + 4} fontSize="11" fill={on ? '#E2B168' : '#8E9BAE'}>{pt.n}</text>
                </g>
              );
            })}
          </svg>
          <div className="fade-in mt-4 rounded-lg border border-line bg-canvas p-4" key={sel} aria-live="polite">
            <p className="text-title text-accent">{p.name}</p>
            <p className="mt-0.5 text-caption text-ink/80">{p.spec}</p>
            <p className="mt-2 text-body text-muted">{p.note}</p>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <Label>Eight layers, 4.1 grams</Label>
          <Title className="mt-1">What it’s made of</Title>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {PARTS.map((pt) => {
              const on = pt.n === sel;
              return (
                <li key={pt.n}>
                  <button onClick={() => setSel(pt.n)} aria-pressed={on} className={`grid w-full grid-cols-[2rem_1fr] gap-x-3 py-3 text-left transition-colors sm:grid-cols-[2rem_12rem_1fr] ${on ? 'text-ink' : 'text-ink/70 hover:text-ink'}`}>
                    <span className={`text-caption tabular-nums ${on ? 'text-accent' : 'text-muted'}`}>{pt.n}</span>
                    <span className="text-title">{pt.name}</span>
                    <span className="col-start-2 text-caption text-muted sm:col-start-3">{pt.spec}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[['Weight', '4.1 g'], ['Width', '18 mm'], ['Thickness', '3.4 mm']].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line bg-canvas p-3">
                <p className="text-caption text-muted">{k}</p>
                <p className="mt-0.5 text-title tabular-nums text-ink">{v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <Label>In the box</Label>
            <Title className="mt-1">Starter kit</Title>
          </div>
          <span className="text-caption text-muted">{inr(PRICING.kit + PRICING.shell)} incl. GST · 30-day return window</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {BOX.map(([name, meta, icon]) => (
            <div key={name} className="rounded-lg border border-line bg-canvas p-4">
              <Icon name={icon} size={20} className="text-accent" />
              <p className="mt-3 text-title text-ink">{name}</p>
              <p className="mt-0.5 text-caption text-muted">{meta}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
