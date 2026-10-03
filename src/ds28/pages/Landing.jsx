import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Head3D, { MORPHS } from '../components/Head3D.jsx';
import Logo from '../components/Logo.jsx';

/** Mode 1: minimal 3D showcase. "GET YOURS NOW" plays an exit transition, then enters the flow. */
export default function Landing({ onEnter, hasOrder, onManual }) {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const m = MORPHS[idx];

  const enter = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onEnter, 760);
  };

  return (
    <div className={`landing ${leaving ? 'leaving' : ''}`} style={{ '--morph': m.color }}>
      <header className="landing-top">
        <span className="brand">
          <Logo />
          <span>Neural Stream<sup>™</sup> <b>DS-28</b></span>
        </span>
        {hasOrder && (
          <button className="btn btn-ghost small" onClick={onManual}>My Web Manual</button>
        )}
      </header>

      <div className="landing-stage">
        <Head3D leaving={leaving} onMorph={setIdx} />
        <div className="morph-readout mono" aria-live="polite">
          <span>MORPH {String(idx + 1).padStart(2, '0')}/{String(MORPHS.length).padStart(2, '0')}</span>
          <span className="morph-name">{m.name}</span>
          <span>TEMPLE · 0.82 kΩ</span>
        </div>
      </div>

      <div className="landing-copy">
        <h1 className="landing-title">
          Neural Stream<sup>™</sup> DS-28 <span className="dash">—</span> <em>Wear Your Motor Intent.</em>
        </h1>
        <button className="btn-neon" onClick={enter}>
          GET YOURS NOW <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
        <p className="mono small muted">Non-invasive sEMG + stimulation patch · from $340 · drag the head to turn it</p>
      </div>
      <div className="wipe" aria-hidden="true" />
    </div>
  );
}
