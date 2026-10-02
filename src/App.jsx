import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import FrameTabs from './components/FrameTabs.jsx';
import MarketplaceFrame from './frames/MarketplaceFrame.jsx';
import ActiveSessionFrame from './frames/ActiveSessionFrame.jsx';
import DiagnosticFrame from './frames/DiagnosticFrame.jsx';
import { useSessionTimer } from './hooks/useSessionTimer.js';

function DeviceFooter({ frame }) {
  return (
    <footer className="flex shrink-0 items-center justify-between border-t border-syn-hairline bg-syn-canvas px-4 py-2">
      <span className="t-data text-[9px] uppercase tracking-instrument text-syn-muted">
        SYN-OS 35.2 · <span className="text-syn-ink/70">{frame}</span>
      </span>
      <span className="t-data text-[9px] uppercase tracking-instrument text-syn-muted">ENC AES-Q · CDSCO-III</span>
    </footer>
  );
}

export default function App() {
  const [frame, setFrame] = useState('market');
  const { session, start, terminate } = useSessionTimer();
  const scrollRef = useRef(null);

  // Reset scroll to top on every frame switch, like a terminal page change.
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
    <div className="bg-grid flex min-h-[100dvh] items-stretch justify-center sm:items-center sm:p-6">
      {/* Handheld terminal shell */}
      <div className="relative flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-syn-canvas sm:h-[860px] sm:max-h-[calc(100dvh-3rem)] sm:rounded-md sm:border sm:border-syn-frame">
        <Header />
        <FrameTabs active={frame} onChange={setFrame} sessionStatus={session.status} />

        <main ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto">
          {frame === 'market' && <MarketplaceFrame onRent={handleRent} sessionStatus={session.status} />}
          {frame === 'session' && (
            <ActiveSessionFrame
              session={session}
              onTerminate={terminate}
              onViewReport={() => setFrame('report')}
              onBrowse={() => setFrame('market')}
            />
          )}
          {frame === 'report' && <DiagnosticFrame onClose={() => setFrame('market')} />}
        </main>

        <DeviceFooter frame={frame === 'market' ? 'FRAME 01' : frame === 'session' ? 'FRAME 02' : 'FRAME 03'} />
      </div>
    </div>
  );
}
