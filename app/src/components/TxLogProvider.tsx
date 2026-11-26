import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { TxLogContext, type TxLog, type TxLogItem } from '../hooks/useTxLog';

/** How many recent transactions to keep on screen. */
const MAX_ITEMS = 3;
/** Successful transactions disappear by themselves after this long; failed ones stay until closed. */
const AUTO_DISMISS_MS = 8_000;

/** Remembers the latest transactions so their Explorer links stay visible, even after the button that sent them disappears. */
export function TxLogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TxLogItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const add = useCallback(
    (item: Omit<TxLogItem, 'id'>) => {
      const id = nextId.current++;
      setItems((current) => [{ ...item, id }, ...current].slice(0, MAX_ITEMS));
      if (item.ok) timers.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS));
    },
    [dismiss],
  );

  // Stop any pending timers when the app unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const log = useMemo<TxLog>(() => ({ items, add, dismiss }), [items, add, dismiss]);
  return <TxLogContext.Provider value={log}>{children}</TxLogContext.Provider>;
}
