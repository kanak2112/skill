import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PatchSVG from '../components/PatchSVG.jsx';
import { Card, Label, Title } from '../ui.jsx';
import { NODES, findFinish, findNode } from '../data.js';

// Positions on the 260 × 420 schematic from the original manual.
const POS = { temple: [128, 62], cervical: [112, 128], forearm: [196, 262] };

export default function MapTab({ order, onOrder }) {
  const worn = order.design.nodeId;
  const [sel, setSel] = useState(worn);
  const n = findNode(sel);
  const finish = findFinish(order.design.finishId);
  const [wx, wy] = POS[worn];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <Label>Three places to wear it</Label>
        <svg viewBox="0 0 290 420" className="mx-auto mt-4 w-full max-w-[300px]" role="group" aria-label="Body diagram with the three wearing spots">
          <g fill="none" stroke="#8E9BAE" strokeOpacity="0.7" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
            <ellipse cx="112" cy="68" rx="30" ry="37" fill="#090D14" />
            <path d="M98 102 L100 124 M126 102 L124 124" />
            <path d="M100 124 C78 128 58 134 52 150 L44 236 L36 316 M124 124 C146 128 166 134 172 150 L184 228 L200 300" />
            <path d="M66 156 L72 250 L80 400 M158 156 L152 250 L144 400" />
            <path d="M72 250 C96 262 128 262 152 250" />
            <path d="M36 316 L32 340 M200 300 L210 322" />
          </g>
          {/* The customer's own shell, where they chose to wear it */}
          <PatchSVG shape={order.design.shape} color={finish.hex} coating={order.design.coating} glow={0.6} x={wx - 13} y={wy - 13} width="26" height="26" />
          {NODES.map((v) => {
            const [x, y] = POS[v.id];
            const on = v.id === sel;
            return (
              <g
                key={v.id}
                role="button"
                tabIndex="0"
                aria-pressed={on}
                aria-label={`Show ${v.name}`}
                onClick={() => setSel(v.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(v.id))}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <circle cx={x} cy={y} r="20" fill="transparent" />
                <circle cx={x} cy={y} r={on ? 18 : 15} fill="none" stroke="#E2B168" strokeWidth={on ? 1.4 : 1} strokeDasharray={v.id === worn ? undefined : '3 3'} opacity={on ? 1 : 0.5} />
                <text x={v.id === 'cervical' ? x - 24 : x + 24} y={y + 4} textAnchor={v.id === 'cervical' ? 'end' : 'start'} fontSize="11" fill={on ? '#E2B168' : '#8E9BAE'}>
                  {v.name}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {NODES.map((v) => (
            <button
              key={v.id}
              onClick={() => setSel(v.id)}
              aria-pressed={v.id === sel}
              className={`h-10 rounded-lg border text-[13px] transition-colors ${v.id === sel ? 'border-accent/60 bg-canvas text-ink' : 'border-line text-muted hover:text-ink'}`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-3" key={sel}>
        <div className="fade-in">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Label>{sel === worn ? 'Where you wear it' : 'Another option'}</Label>
              <Title className="mt-1">{n.name}</Title>
              <p className="mt-1 text-body text-muted">{n.bestFor}</p>
            </div>
            <div className="text-right">
              <Label>Signal quality</Label>
              <p className="metric mt-1 text-accent">{n.fidelity}%</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${n.fidelity}%` }} />
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <Label className="flex items-center gap-2"><Icon name="back_hand" size={16} /> What it helps with</Label>
              <ul className="mt-3 flex flex-col gap-2.5">
                {n.helps.map((p) => <li key={p} className="border-l border-accent/40 pl-3 text-body text-ink/85">{p}</li>)}
              </ul>
            </div>
            <div>
              <Label className="flex items-center gap-2"><Icon name="straighten" size={16} /> How to place it</Label>
              <ul className="mt-3 flex flex-col gap-2.5">
                {n.place.map((p) => <li key={p} className="border-l border-line pl-3 text-body text-ink/85">{p}</li>)}
              </ul>
            </div>
          </div>

          <details className="group mt-6 rounded-lg border border-line bg-canvas">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-body text-muted hover:text-ink">
              Technical details <Icon name="expand_more" size={18} className="transition-transform group-open:rotate-180" />
            </summary>
            <dl className="grid grid-cols-3 gap-2 px-4 pb-4">
              {n.tech.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-caption text-muted">{k}</dt>
                  <dd className="text-body tabular-nums text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </details>

          {sel !== worn && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line p-3">
              <p className="text-caption text-muted">Moving the patch means calibrating again in the new spot.</p>
              <button className="btn-secondary h-9 text-[13px]" onClick={() => onOrder({ design: { ...order.design, nodeId: sel }, calibrated: false })}>
                Wear it here instead
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
