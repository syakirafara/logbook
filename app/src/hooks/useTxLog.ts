import { createContext, useContext } from 'react';

/** One sent transaction, shown in the "Recent transactions" list with an Explorer link. */
export interface TxLogItem {
  id: number;
  label: string;
  signature: string;
  ok: boolean;
}

export interface TxLog {
  items: TxLogItem[];
  add: (item: Omit<TxLogItem, 'id'>) => void;
  dismiss: (id: number) => void;
}

export const TxLogContext = createContext<TxLog | null>(null);

/** The list of recent transactions, provided by <TxLogProvider>. */
export function useTxLog(): TxLog {
  const log = useContext(TxLogContext);
  if (!log) throw new Error('useTxLog must be used inside <TxLogProvider>');
  return log;
}
