import { useChainClock } from '../hooks/useChainClock';
import type { Entry, Internship } from '../lib/paraf';
import { dayState, type DayState } from '../lib/schedule';
import { STATE_SYMBOL } from '../lib/symbols';
import { t } from '../strings';

const LEGEND: DayState[] = ['approved', 'autoApproved', 'rejected', 'pending', 'silent', 'missing', 'today', 'upcoming'];

/** One square per day, coloured by status (with a symbol too, for colour-blind readers). */
export function CalendarGrid(props: {
  internship: Internship;
  entries: (Entry | null)[];
  selected: number | null;
  onSelect: (day: number) => void;
}) {
  const { internship, entries, selected, onSelect } = props;
  const { now } = useChainClock();

  return (
    <div>
      <ol className="calendar" aria-label={t.verify.calendarTitle}>
        {Array.from({ length: internship.totalPeriods }, (_, day) => {
          const state = dayState(internship, entries[day], day, now);
          const label = `${t.common.day(day + 1)}: ${t.status[state]}`;
          return (
            <li key={day}>
              <button
                type="button"
                className={`cell state-${state}`}
                aria-label={label}
                title={label}
                aria-pressed={selected === day}
                onClick={() => onSelect(day)}
              >
                <span className="cell-day">{day + 1}</span>
                <span className="cell-symbol" aria-hidden="true">
                  {STATE_SYMBOL[state]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <ul className="legend" aria-label={t.status.legend}>
        {LEGEND.map((state) => (
          <li key={state}>
            <span className={`swatch state-${state}`} aria-hidden="true">
              {STATE_SYMBOL[state]}
            </span>
            {t.status[state]}
          </li>
        ))}
      </ul>
    </div>
  );
}
