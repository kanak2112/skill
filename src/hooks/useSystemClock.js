import { useEffect, useState } from 'react';

// Simulated terminal clock. Boots at 09:41:00 IST and ticks forward in real
// time so the prototype always opens on the canonical status-bar reading.
const BOOT_SECONDS = 9 * 3600 + 41 * 60;

export function useSystemClock() {
  const [seconds, setSeconds] = useState(BOOT_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s + 1) % 86400), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
