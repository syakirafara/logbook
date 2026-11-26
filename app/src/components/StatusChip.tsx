import type { DayState } from '../lib/schedule';
import { STATE_SYMBOL } from '../lib/symbols';
import { t } from '../strings';

/** A coloured label for a day's state, with a symbol too (see lib/symbols.ts). */
export function StatusChip({ state }: { state: DayState }) {
  return (
    <span className={`chip state-${state}`}>
      {STATE_SYMBOL[state] && <span aria-hidden="true">{STATE_SYMBOL[state]}</span>}
      {t.status[state]}
    </span>
  );
}
