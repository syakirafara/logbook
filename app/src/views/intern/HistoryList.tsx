import { Countdown } from '../../components/Countdown';
import { FinalizeButton } from '../../components/FinalizeButton';
import { StatusChip } from '../../components/StatusChip';
import { useChainClock } from '../../hooks/useChainClock';
import { formatDateTime, reasonLabel } from '../../lib/format';
import type { Entry, Internship } from '../../lib/paraf';
import { dayState, periodStart, reviewDeadline, startedDays } from '../../lib/schedule';
import { t } from '../../strings';

interface Props {
  internship: Internship;
  entries: (Entry | null)[];
  onChanged: () => void;
}

/** Every day so far, newest first, with its status, review countdown, and Finalize when the supervisor was silent. */
export function HistoryList({ internship, entries, onChanged }: Props) {
  const { now } = useChainClock();
  const dayCount = startedDays(internship, now);
  // Newest first: [dayCount - 1, ..., 1, 0]
  const days = Array.from({ length: dayCount }, (_, i) => dayCount - 1 - i);
  // Short demo days need seconds in the times.
  const withSeconds = internship.periodSecs < 3600;

  return (
    <section className="card" aria-labelledby="history-title">
      <h3 id="history-title">{t.intern.historyTitle}</h3>
      {dayCount === 0 ? (
        <p className="muted">{t.intern.historyEmpty}</p>
      ) : (
        <ol className="history">
          {days.map((day) => {
            const entry = entries[day] ?? null;
            const state = dayState(internship, entry, day, now);
            return (
              <li key={day} className="history-row">
                <div className="history-head">
                  <span className="history-day">{t.common.day(day + 1)}</span>
                  <span className="muted">{formatDateTime(periodStart(internship, day), withSeconds)}</span>
                  <StatusChip state={state} />
                </div>
                {entry && <p className="summary">{entry.summary}</p>}
                {entry && state === 'pending' && (
                  <p className="help">
                    {t.intern.reviewLeft} <Countdown to={reviewDeadline(internship, entry)} />
                  </p>
                )}
                {entry && state === 'rejected' && (
                  <p className="help">
                    {t.verify.reason}: {reasonLabel(entry.reasonCode)}
                  </p>
                )}
                {entry && state === 'silent' && (
                  <>
                    <p className="help">{t.intern.silentNote}</p>
                    <FinalizeButton internship={internship} entry={entry} onDone={onChanged} />
                  </>
                )}
                {state === 'missing' && <p className="help">{t.intern.missingNote}</p>}
                {state === 'today' && <p className="help">{t.intern.todayNotWritten}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
