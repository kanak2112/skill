import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './components/Icon.jsx';
import Header from './components/Header.jsx';
import FrameTabs from './components/FrameTabs.jsx';
import SkillSheet from './components/SkillSheet.jsx';
import MarketplaceFrame from './frames/MarketplaceFrame.jsx';
import ActiveSessionFrame from './frames/ActiveSessionFrame.jsx';
import DiagnosticFrame from './frames/DiagnosticFrame.jsx';
import { useSessionTimer } from './hooks/useSessionTimer.js';
import { useAnomaly } from './hooks/useAnomaly.js';

export default function App() {
  const [frame, setFrame] = useState('market');
  const [sheetModel, setSheetModel] = useState(null);
  const { session, start, terminate } = useSessionTimer();
  const anomaly = useAnomaly(session.status === 'active');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [frame]);

  const handleRent = useCallback(
    (durationKey, model) => {
      start(durationKey, model);
      setSheetModel(null);
      setFrame('session');
    },
    [start],
  );

  const switchFrame = (id) => {
    setSheetModel(null);
    setFrame(id);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center gap-3 p-3 sm:justify-center sm:p-6">
      {/* Device */}
      <div className="relative flex h-[calc(100dvh-4.5rem)] min-h-[600px] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:h-[860px] sm:max-h-[calc(100dvh-6rem)]">
        <Header sessionStatus={session.status} />

        <main
          ref={scrollRef}
          className={`no-scrollbar min-h-0 flex-1 ${frame === 'market' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {frame === 'market' && <MarketplaceFrame onOpen={setSheetModel} />}
          {frame === 'session' && (
            <ActiveSessionFrame
              session={session}
              anomaly={anomaly}
              onTerminate={terminate}
              onViewReport={() => setFrame('report')}
            />
          )}
          {frame === 'report' && <DiagnosticFrame session={session} onDone={() => setFrame('market')} />}
        </main>

        {sheetModel && (
          <SkillSheet key={sheetModel.id} model={sheetModel} onClose={() => setSheetModel(null)} onRent={handleRent} />
        )}
      </div>

      {/* Prototype-only controls, kept outside the device */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <FrameTabs active={frame} onChange={switchFrame} />
        {frame === 'session' && session.status === 'active' && (
          <button
            onClick={anomaly.trigger}
            className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12px] text-muted hover:text-ink"
          >
            <Icon name="vital_signs" size={14} /> Simulate anomaly
          </button>
        )}
      </div>
    </div>
  );
}
