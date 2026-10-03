import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { parsePrompt, presetShape } from '../shapes.js';
import { findFinish } from '../data.js';

const EXAMPLES = [
  'A glossy crimson anger glyph',
  'Cyber cyan lightning bolt',
  'Matte gold teardrop',
  'Satin heart in stealth slate',
];

/** Describe a shell in words. Speech input where the browser allows it, typing otherwise. */
export default function VoiceInput({ design, onChange }) {
  const [text, setText] = useState(design.prompt ?? EXAMPLES[0]);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [heardNothing, setHeardNothing] = useState(false);
  const timer = useRef(0);
  const recog = useRef(null);
  useEffect(() => () => {
    clearTimeout(timer.current);
    recog.current?.abort?.();
  }, []);

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const listen = () => {
    if (!SR || listening) return;
    setHeardNothing(false);
    try {
      const r = new SR();
      recog.current = r;
      r.lang = 'en-IN';
      r.interimResults = true;
      let heard = false;
      r.onresult = (e) => {
        heard = true;
        setText([...e.results].map((x) => x[0].transcript).join(' '));
      };
      r.onend = () => {
        setListening(false);
        if (!heard) setHeardNothing(true);
      };
      r.onerror = () => {
        setListening(false);
        setHeardNothing(true);
      };
      setListening(true);
      r.start();
    } catch {
      setListening(false);
      setHeardNothing(true);
    }
  };

  const create = (value = text) => {
    if (busy || !value.trim()) return;
    setBusy(true);
    const parsed = parsePrompt(value);
    timer.current = setTimeout(() => {
      setBusy(false);
      onChange({
        shape: { ...presetShape(parsed.presetId), source: 'description' },
        prompt: value,
        ...(parsed.finishId && { finishId: parsed.finishId }),
        ...(parsed.coating && { coating: parsed.coating }),
      });
    }, 700);
  };

  const parsed = parsePrompt(design.prompt ?? text);

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="prompt" className="text-section text-muted">Describe the shape and colour you want</label>
      <div className={`flex gap-2 rounded-lg border bg-canvas p-2 transition-colors ${listening ? 'border-accent' : 'border-line focus-within:border-accent/60'}`}>
        <textarea
          id="prompt"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), create())}
          className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-ink outline-none placeholder:text-muted"
          placeholder="For example: a glossy crimson anger glyph"
        />
        {SR && (
          <button
            onClick={listen}
            className={`grid h-10 w-10 shrink-0 place-items-center self-start rounded-lg border ${listening ? 'border-accent bg-accent text-[#0F172A]' : 'border-line text-muted hover:text-ink'}`}
            aria-label={listening ? 'Listening' : 'Speak your description'}
          >
            <Icon name={listening ? 'graphic_eq' : 'mic'} size={20} />
          </button>
        )}
      </div>
      {heardNothing && <p className="text-caption text-amber">Didn’t catch that. Check microphone access, or type your description instead.</p>}

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setText(ex);
              create(ex);
            }}
            className="tag border border-line text-muted hover:border-accent/60 hover:text-ink"
          >
            {ex}
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={() => create()} disabled={busy}>
        <Icon name="auto_awesome" size={18} /> {busy ? 'Creating your shape…' : 'Create shape'}
      </button>

      {design.shape.source === 'description' && (
        <p className="text-caption text-muted">
          We read: <span className="text-ink">{presetShape(parsed.presetId).name}</span>
          {parsed.finishId && <> · <span className="text-ink">{findFinish(parsed.finishId).name}</span></>}
          {parsed.coating && <> · <span className="text-ink capitalize">{parsed.coating}</span> finish</>}
          . Anything you don’t mention keeps its current setting.
        </p>
      )}
    </div>
  );
}
