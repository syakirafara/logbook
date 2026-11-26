import type { DayState } from './schedule';

/** A small symbol per day state, so a status never depends on colour alone. */
export const STATE_SYMBOL: Record<DayState, string> = {
  approved: '✓',
  autoApproved: '✓',
  rejected: '✕',
  pending: '…',
  silent: '!',
  missing: '–',
  today: '•',
  upcoming: '',
};
