import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PatchSVG from '../components/PatchSVG.jsx';
import BodyPreview from '../components/BodyPreview.jsx';
import VoiceInput from '../components/VoiceInput.jsx';
import SketchInput from '../components/SketchInput.jsx';
import ImageInput from '../components/ImageInput.jsx';
import { Card, Label, PageHead } from '../ui.jsx';
import { COATINGS, FINISHES, NODES, PRICING, findFinish, findNode, inr } from '../data.js';

const MODES = [
  { id: 'describe', label: 'Describe it', icon: 'edit_note' },
  { id: 'draw', label: 'Pick or draw', icon: 'draw' },
  { id: 'upload', label: 'Upload a picture', icon: 'image' },
];

/** Step 1: design the shell, choose its finish, and try it on. */
export default function Design({ design, onChange, onNext }) {
  const [mode, setMode] = useState('describe');
  const [zoom, setZoom] = useState(true);
  const finish = findFinish(design.finishId);
  const node = findNode(design.nodeId);

  return (
    <div className="fade-in">
      <PageHead step="Step 1 of 3" title="Design your shell">
        The shell is the printed cover that clips over your patch. Make it in any of three ways, then see how it looks where you’ll wear it.
      </PageHead>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <div role="tablist" aria-label="How to create your shape" className="mb-5 grid grid-cols-3 gap-1 rounded-lg border border-line bg-canvas p-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={mode === m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex h-10 items-center justify-center gap-1.5 rounded-md px-2 text-[13px] transition-colors ${mode === m.id ? 'bg-surface text-ink shadow-[inset_0_0_0_1px_#222A38]' : 'text-muted hover:text-ink'}`}
                >
                  <Icon name={m.icon} size={16} />
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
            {mode === 'describe' && <VoiceInput design={design} onChange={onChange} />}
            {mode === 'draw' && <SketchInput design={design} onChange={onChange} />}
            {mode === 'upload' && <ImageInput onChange={onChange} />}
          </Card>

          <Card>
            <Label>Colour</Label>
            <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Colour">
              {FINISHES.map((f) => {
                const on = design.finishId === f.id;
                return (
                  <button
                    key={f.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => onChange({ finishId: f.id })}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${on ? 'border-accent bg-accent/5' : 'border-line hover:border-muted/50'}`}
                  >
                    <span className="h-6 w-6 shrink-0 rounded-full ring-1 ring-white/15" style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), transparent 45%), ${f.hex}` }} />
                    <span className="min-w-0 text-[14px] text-ink">{f.name}</span>
                  </button>
                );
              })}
            </div>
            <Label className="mt-5">Finish</Label>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-line bg-canvas p-1" role="radiogroup" aria-label="Finish">
              {COATINGS.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={design.coating === c.id}
                  onClick={() => onChange({ coating: c.id })}
                  className={`h-9 rounded-md text-[13px] transition-colors ${design.coating === c.id ? 'bg-accent font-medium text-[#0F172A]' : 'text-muted hover:text-ink'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>Your shell</Label>
                <p className="mt-1 text-title text-ink">{design.shape.name}</p>
              </div>
              <span className="tag border border-line text-muted">{finish.name} · {design.coating}</span>
            </div>
            <div className="relative mt-4 grid h-[220px] place-items-center overflow-hidden rounded-lg border border-line bg-canvas">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(226,177,104,0.07),transparent_60%)]" />
              <PatchSVG key={design.shape.d} className="relative h-[150px] w-[150px] fade-in" shape={design.shape} color={finish.hex} coating={design.coating} glow={0.5} title={`${design.shape.name} in ${finish.name}`} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <Label>Try it on</Label>
              <button className="btn-secondary h-8 px-3 text-[12px]" onClick={() => setZoom((z) => !z)}>
                <Icon name={zoom ? 'zoom_out' : 'zoom_in'} size={16} /> {zoom ? 'Whole body' : 'Close up'}
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="aspect-[1/1.3] overflow-hidden rounded-lg border border-line bg-canvas">
                <BodyPreview shape={design.shape} color={finish.hex} coating={design.coating} nodeId={design.nodeId} zoom={zoom} onNode={(id) => onChange({ nodeId: id })} glow={0.5} />
              </div>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Where you will wear it">
                {NODES.map((n) => {
                  const on = design.nodeId === n.id;
                  return (
                    <button
                      key={n.id}
                      role="radio"
                      aria-checked={on}
                      onClick={() => onChange({ nodeId: n.id })}
                      className={`rounded-lg border p-3 text-left transition-colors ${on ? 'border-accent bg-accent/5' : 'border-line hover:border-muted/50'}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-title text-ink">{n.name}</span>
                        <span className={`text-caption ${on ? 'text-accent' : 'text-muted'}`}>{n.signal}</span>
                      </span>
                      <span className="mt-1 block text-caption text-muted">{n.bestFor}</span>
                    </button>
                  );
                })}
                <p className="mt-1 text-caption text-muted">You can move the patch to another spot later. This only sets how the shell is shaped and shown.</p>
              </div>
            </div>
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Label>Patch + your shell</Label>
              <p className="metric mt-1 text-ink">{inr(PRICING.kit + PRICING.shell)}</p>
              <p className="text-caption text-muted">GST included · {node.name} placement</p>
            </div>
            <button className="btn-primary" onClick={onNext}>
              Continue to delivery <Icon name="arrow_forward" size={18} />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
