import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Never ask the RPC server more often than this. The free devnet server allows about
 * 100 requests per 10 seconds per IP address, shared by everything on your network.
 */
const MIN_INTERVAL_MS = 10_000;

export interface Polled<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  /** Load again right now, for example after a transaction. */
  refresh: () => void;
}

interface PollState<T> {
  key: string | null;
  data?: T;
  error?: unknown;
  loading: boolean;
}

/**
 * Loads data now and then again every `intervalMs` (at least 10 s), but only while the tab is visible.
 * `key` names what is being loaded (for example "intern:<wallet>"). When it changes, old data is
 * dropped and loading starts over. Pass `null` to load nothing (for example when no wallet is connected).
 */
export function usePolledData<T>(key: string | null, load: () => Promise<T>, intervalMs = 15_000): Polled<T> {
  const [state, setState] = useState<PollState<T>>({ key: null, loading: false });
  const loadRef = useRef(load);
  const keyRef = useRef(key);
  const inFlightRef = useRef<string | null>(null);
  const againRef = useRef(false);

  // Always call the newest `load` function without restarting the timer.
  useEffect(() => {
    loadRef.current = load;
  });

  const run = useCallback(async () => {
    const runKey = keyRef.current;
    if (runKey === null) return;
    // Already loading this key? Remember to load once more when it finishes (the data may be old).
    if (inFlightRef.current === runKey) {
      againRef.current = true;
      return;
    }
    inFlightRef.current = runKey;
    setState((s) => (s.key === runKey ? { ...s, loading: true } : { key: runKey, loading: true }));
    do {
      againRef.current = false;
      try {
        const data = await loadRef.current();
        if (keyRef.current === runKey) setState({ key: runKey, data, loading: false });
      } catch (error) {
        if (keyRef.current === runKey) setState((s) => ({ ...s, key: runKey, error, loading: false }));
      }
    } while (againRef.current && keyRef.current === runKey);
    if (inFlightRef.current === runKey) inFlightRef.current = null;
  }, []);

  useEffect(() => {
    keyRef.current = key;
    if (key === null) return;
    void run();
    const timer = setInterval(() => {
      if (!document.hidden) void run();
    }, Math.max(intervalMs, MIN_INTERVAL_MS));
    return () => clearInterval(timer);
  }, [key, intervalMs, run]);

  const isCurrent = state.key === key;
  return {
    data: isCurrent ? state.data : undefined,
    error: isCurrent ? state.error : undefined,
    loading: key !== null && (!isCurrent || state.loading),
    refresh: () => void run(),
  };
}
