import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
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
      <FrameTabs active={frame} onChange={switchFrame} />

      {/* Device */}
      <div className="relative flex h-[calc(100dvh-7.5rem)] min-h-[600px] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:h-[860px] sm:max-h-[calc(100dvh-9rem)]">
        <Header sessionStatus={session.status} />

        <main
          ref={scrollRef}
          className={`no-scrollbar min-h-0 flex-1 ${frame === 'market' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {frame === 'market' && <MarketplaceFrame onOpen={setSheetModel} onRent={handleRent} />}
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

      {/* Prototype-only controls */}
      <div className="flex h-8 items-center gap-3 text-[12px] text-muted">
        {frame === 'session' && session.status === 'active' ? (
          <button
            onClick={anomaly.trigger}
            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 hover:text-ink"
          >
            <Activity className="h-3.5 w-3.5" /> Simulate anomaly
          </button>
        ) : frame === 'market' ? (
          <span>Drag sideways to browse · swipe up or down to change area · tap a card for details</span>
        ) : null}
      </div>
    </div>
  );
}
