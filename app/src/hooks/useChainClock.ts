import { createContext, useContext } from 'react';

export interface ChainClock {
  /** The blockchain's time right now, in whole Unix seconds. Changes every second. */
  now: number;
  /** Reads the chain time at this moment (for code outside rendering, such as loading data). */
  getNow: () => number;
  /** How many seconds the chain clock is ahead of this device (negative = behind). */
  offset: number;
  /** False until the chain clock has been read once. */
  synced: boolean;
}

export const ChainClockContext = createContext<ChainClock | null>(null);

/** The chain clock, provided by <ChainClockProvider> (see components/ChainClockProvider.tsx). */
export function useChainClock(): ChainClock {
  const clock = useContext(ChainClockContext);
  if (!clock) throw new Error('useChainClock must be used inside <ChainClockProvider>');
  return clock;
}
