import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import FrameTabs from './components/FrameTabs.jsx';
import MarketplaceFrame from './frames/MarketplaceFrame.jsx';
import ActiveSessionFrame from './frames/ActiveSessionFrame.jsx';
import DiagnosticFrame from './frames/DiagnosticFrame.jsx';
import { useSessionTimer } from './hooks/useSessionTimer.js';

export default function App() {
  const [frame, setFrame] = useState('market');
  const { session, start, terminate } = useSessionTimer();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [frame]);

  const handleRent = useCallback(
    (durationKey, profile) => {
      start(durationKey, profile);
      setFrame('session');
    },
    [start],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col items-center gap-4 p-3 sm:justify-center sm:p-6">
      <FrameTabs active={frame} onChange={setFrame} />

      {/* Device */}
      <div className="relative flex h-[calc(100dvh-5rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:h-[860px] sm:max-h-[calc(100dvh-7rem)]">
        <Header sessionStatus={session.status} />

        <main ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto">
          {frame === 'market' && <MarketplaceFrame onRent={handleRent} />}
          {frame === 'session' && (
            <ActiveSessionFrame session={session} onTerminate={terminate} onViewReport={() => setFrame('report')} />
          )}
          {frame === 'report' && <DiagnosticFrame onDone={() => setFrame('market')} />}
        </main>
      </div>
    </div>
  );
}
