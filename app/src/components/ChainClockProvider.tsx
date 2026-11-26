import { useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChainClockContext, type ChainClock } from '../hooks/useChainClock';
import { readChainTime } from '../lib/chainClock';

/** Read the chain clock again every 45 s. Between reads we add the device clock's progress. */
const SYNC_EVERY_MS = 45_000;

/**
 * Keeps the difference ("offset") between the blockchain clock and this device's clock,
 * and gives every component the chain time, updated once per second.
 */
export function ChainClockProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [synced, setSynced] = useState(false);
  const [deviceMs, setDeviceMs] = useState(() => Date.now());

  // Read the chain clock now, every 45 s, and when the tab becomes visible again.
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (document.hidden) return; // no requests while the tab is in the background
      try {
        const chainTime = await readChainTime(connection);
        if (cancelled) return;
        offsetRef.current = chainTime - Date.now() / 1000;
        setOffset(offsetRef.current);
        setSynced(true);
      } catch {
        // Keep the previous offset and try again on the next round.
      }
    };
    const onVisible = () => {
      if (!document.hidden) void sync();
    };
    void sync();
    const timer = setInterval(sync, SYNC_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [connection]);

  // Tick once per second so countdowns move. This uses the device clock only: no network requests.
  useEffect(() => {
    const timer = setInterval(() => setDeviceMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getNow = useCallback(() => Math.floor(Date.now() / 1000 + offsetRef.current), []);

  const clock = useMemo<ChainClock>(
    () => ({ now: Math.floor(deviceMs / 1000 + offset), getNow, offset: Math.round(offset), synced }),
    [deviceMs, offset, synced, getNow],
  );

  return <ChainClockContext.Provider value={clock}>{children}</ChainClockContext.Provider>;
}
