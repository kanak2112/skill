import { useCallback, useEffect, useState } from 'react';

export const DURATIONS = {
  '15m': { label: '15m', seconds: 15 * 60, multiplier: 0.25 },
  '1h': { label: '1h', seconds: 60 * 60, multiplier: 1 },
  '4h': { label: '4h', seconds: 4 * 60 * 60, multiplier: 4 },
};

// Demo boot state: a 1h stream already in progress with 42:19 remaining.
export const DEFAULT_PROFILE = 'Chef Arjun Mehra — Knife Prep';

const DEMO_SESSION = {
  durationKey: '1h',
  total: 3600,
  remaining: 42 * 60 + 19,
  status: 'active',
  profile: DEFAULT_PROFILE,
};

/**
 * Session lifecycle lives above the frames so the countdown keeps running
 * while the operator flips between tabs.
 * status: 'active' | 'terminated' | 'complete'
 */
export function useSessionTimer() {
  const [session, setSession] = useState(DEMO_SESSION);

  useEffect(() => {
    if (session.status !== 'active') return undefined;
    const id = setInterval(() => {
      setSession((s) => {
        if (s.status !== 'active') return s;
        if (s.remaining <= 1) return { ...s, remaining: 0, status: 'complete' };
        return { ...s, remaining: s.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [session.status]);

  const start = useCallback((durationKey, profile = DEFAULT_PROFILE) => {
    const { seconds } = DURATIONS[durationKey];
    setSession({ durationKey, total: seconds, remaining: seconds, status: 'active', profile });
  }, []);

  const terminate = useCallback(() => {
    setSession((s) => (s.status === 'active' ? { ...s, status: 'terminated' } : s));
  }, []);

  return { session, start, terminate };
}

export function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
