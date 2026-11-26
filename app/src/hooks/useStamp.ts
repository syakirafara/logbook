import { createContext, useContext } from 'react';

/** Which stamp to show: the supervisor approved, or the page was approved by silence. */
export type StampKind = 'approved' | 'autoApproved';

export interface StampApi {
  /** Drops the big stamp onto the screen for a moment. */
  showStamp: (kind: StampKind) => void;
}

export const StampContext = createContext<StampApi | null>(null);

/** The stamp animation, provided by <StampProvider>. */
export function useStamp(): StampApi {
  const api = useContext(StampContext);
  if (!api) throw new Error('useStamp must be used inside <StampProvider>');
  return api;
}
