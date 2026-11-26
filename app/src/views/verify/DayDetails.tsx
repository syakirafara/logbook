import { AddressLink } from '../../components/AddressLink';
import { Countdown } from '../../components/Countdown';
import { FinalizeButton } from '../../components/FinalizeButton';
import { Stamp } from '../../components/Stamp';
import { StatusChip } from '../../components/StatusChip';
import { useChainClock } from '../../hooks/useChainClock';
import { toHex } from '../../lib/bytes';
import { formatDateTime, reasonLabel } from '../../lib/format';
import { isEmptyHash } from '../../lib/hash';
import type { Entry, Internship } from '../../lib/paraf';
import { dayState, reviewDeadline } from '../../lib/schedule';
import { t } from '../../strings';
import { HashCheck } from './HashCheck';

/** Everything the chain knows about one day's page, plus the full-text check. */
export function DayDetails(props: { internship: Internship; entry: Entry | null; day: number; onChanged: () => void }) {
  const { internship, entry, day, onChanged } = props;
  const { now } = useChainClock();
  const state = dayState(internship, entry, day, now);
  const withSeconds = internship.periodSecs < 3600;

  return (
    <section className="card has-stamp" aria-labelledby="day-title">
      <div className="summary-head">
        <h3 id="day-title">{t.common.day(day + 1)}</h3>
        <StatusChip state={state} />
      </div>
      {(state === 'approved' || state === 'autoApproved') && (
        <div className="card-stamp">
          <Stamp kind={state} />
        </div>
      )}

      {!entry ? (
        <p className="muted">{t.verify.noPage}</p>
      ) : (
        <>
          <blockquote className="summary">{entry.summary}</blockquote>
          <dl className="facts">
            <div>
              <dt>{t.verify.submittedAt}</dt>
              <dd>{formatDateTime(entry.submittedAt, withSeconds)}</dd>
            </div>
            {entry.reviewedAt > 0 && (
              <div>
                <dt>{entry.status === 'autoApproved' ? t.verify.finalizedAt : t.verify.reviewedAt}</dt>
                <dd>{formatDateTime(entry.reviewedAt, withSeconds)}</dd>
              </div>
            )}
            {(entry.status === 'rejected' || entry.reasonCode !== 0) && (
              <div>
                <dt>{t.verify.reason}</dt>
                <dd>{reasonLabel(entry.reasonCode)}</dd>
              </div>
            )}
            {state === 'pending' && (
              <div>
                <dt>{t.supervisor.timeLeft}</dt>
                <dd>
                  <Countdown to={reviewDeadline(internship, entry)} />
                </dd>
              </div>
            )}
            <div>
              <dt>{t.verify.fingerprint}</dt>
              <dd className={isEmptyHash(entry.detailHash) ? undefined : 'mono hash'}>
                {isEmptyHash(entry.detailHash) ? t.verify.noFingerprint : toHex(entry.detailHash)}
              </dd>
            </div>
            <div>
              <dt>{t.verify.pageAccount}</dt>
              <dd>
                <AddressLink address={entry.address} />
              </dd>
            </div>
          </dl>
          {state === 'silent' && <FinalizeButton internship={internship} entry={entry} onDone={onChanged} />}
          {!isEmptyHash(entry.detailHash) && <HashCheck entry={entry} />}
        </>
      )}
    </section>
  );
}
