import { useEffect, useRef, useState } from 'react';
import { parsePrompt, presetShape } from '../shapes.js';

const EXAMPLES = [
  'A glossy crimson anger glyph',
  'Cyber cyan lightning bolt',
  'Matte gold teardrop with satin pearl coating',
  'Stealth slate hexagon, brushed and flat',
  'Sculpt a sharp crimson anger symbol with glossy metallic bevels',
];

const LOG = ['Parsing intent tokens', 'Resolving form primitive', 'Lofting bevel geometry', 'Baking coating map'];

/** Voice prompt: real speech recognition where the browser allows it, simulated dictation otherwise. */
export default function VoiceInput({ design, onChange }) {
  const [text, setText] = useState(design.prompt ?? EXAMPLES[0]);
  const [listening, setListening] = useState(false);
  const [step, setStep] = useState(-1);
  const [tokens, setTokens] = useState(() => parsePrompt(design.prompt ?? EXAMPLES[0]).tokens);
  const timers = useRef([]);
  const recog = useRef(null);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    recog.current?.abort?.();
  }, []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const simulateDictation = (phrase) => {
    setText('');
    [...phrase].forEach((_, i) => later(() => setText(phrase.slice(0, i + 1)), 28 * i));
    later(() => setListening(false), 28 * phrase.length + 120);
  };

  const listen = () => {
    if (listening) return;
    setListening(true);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const fallback = () => simulateDictation(EXAMPLES[0]);
    if (!SR) return fallback();
    try {
      const r = new SR();
      recog.current = r;
      r.lang = 'en-US';
      r.interimResults = true;
      let heard = false;
      r.onresult = (e) => {
        heard = true;
        setText([...e.results].map((res) => res[0].transcript).join(' '));
      };
      r.onerror = () => {
        if (!heard) fallback();
        else setListening(false);
      };
      r.onend = () => {
        if (heard) setListening(false);
      };
      r.start();
    } catch {
      fallback();
    }
  };

  const synthesize = () => {
    if (step >= 0 || !text.trim()) return;
    const parsed = parsePrompt(text);
    setTokens(parsed.tokens);
    LOG.forEach((_, i) => later(() => setStep(i), i * 280));
    later(() => {
      setStep(-1);
      const shape = presetShape(parsed.presetId);
      if (parsed.tokens.some((t) => t.kind === 'edge')) shape.cap = 'butt';
      onChange({
        shape: { ...shape, source: 'voice' },
        prompt: text,
        ...(parsed.finishId && { finishId: parsed.finishId }),
        ...(parsed.coating && { coating: parsed.coating }),
      });
    }, LOG.length * 280 + 200);
  };

  return (
    <div className="voice">
      <div className={`voice-box ${listening ? 'listening' : ''}`}>
        <button className={`mic ${listening ? 'on' : ''}`} onClick={listen} aria-label="Dictate prompt">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) synthesize();
          }}
          rows={3}
          aria-label="Sculpt prompt"
          placeholder="Describe your shell…"
        />
        {listening && (
          <div className="wave" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 60}ms` }} />)}
          </div>
        )}
      </div>

      <div className="chips">
        {EXAMPLES.map((ex) => (
          <button key={ex} className="chip chip-btn" onClick={() => setText(ex)}>{ex}</button>
        ))}
      </div>

      <button className="btn btn-primary wide" onClick={synthesize} disabled={step >= 0}>
        {step >= 0 ? `${LOG[step]}…` : 'Synthesize shell'}
      </button>
      {step >= 0 && (
        <div className="progress"><span style={{ width: `${((step + 1) / LOG.length) * 100}%` }} /></div>
      )}

      <div className="tokens">
        <p className="mono small muted">PARSED INTENT</p>
        <ul>
          {tokens.map((t) => (
            <li key={t.kind}>
              <span className="mono tok-k">{t.kind}</span>
              <span className="tok-v">“{t.value}”</span>
              <span className="mono small muted">→ {t.resolved}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
