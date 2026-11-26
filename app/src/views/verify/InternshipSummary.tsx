import { AddressLink } from '../../components/AddressLink';
import { useChainClock } from '../../hooks/useChainClock';
import { formatDateTime, formatSol, formatSpan } from '../../lib/format';
import { isSelfRegistered, type Entry, type Internship } from '../../lib/paraf';
import { currentPeriod, phaseOf } from '../../lib/schedule';
import { t } from '../../strings';

/** Who is involved, the schedule and the totals of one internship. */
export function InternshipSummary({ internship, entries }: { internship: Internship; entries: (Entry | null)[] }) {
  const { now } = useChainClock();
  const phase = phaseOf(internship, now);
  const today = currentPeriod(internship, now);
  const selfRegistered = isSelfRegistered(internship);

  // Missing = days that are over (today does not count yet) without a page.
  const daysOver = phase === 'ended' ? internship.totalPeriods : Math.max(today, 0);
  let missing = 0;
  for (let day = 0; day < daysOver; day++) if (!entries[day]) missing++;

  const progress =
    phase === 'notStarted'
      ? t.verify.notStarted
      : phase === 'ended'
        ? t.verify.finished
        : t.common.dayOf(today + 1, internship.totalPeriods);

  return (
    <section className="card" aria-labelledby="internship-title">
      <div className="summary-head">
        <h3 id="internship-title">{internship.hostOrg}</h3>
        {selfRegistered && <span className="badge badge-warn">{t.verify.selfRegistered}</span>}
      </div>
      {selfRegistered && <p className="help">{t.verify.selfRegisteredHelp}</p>}

      <div className="summary-grid">
        <div>
          <h4>{t.verify.walletsTitle}</h4>
          <dl className="facts">
            <div>
              <dt>{t.verify.internWallet}</dt>
              <dd>
                <AddressLink address={internship.intern} />
              </dd>
            </div>
            <div>
              <dt>{t.verify.supervisorWallet}</dt>
              <dd>
                <AddressLink address={internship.supervisor} />
              </dd>
            </div>
            <div>
              <dt>{t.verify.coordinatorWallet}</dt>
              <dd>
                <AddressLink address={internship.coordinator} />
              </dd>
            </div>
            <div>
              <dt>{t.verify.internshipAccount}</dt>
              <dd>
                <AddressLink address={internship.address} />
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <h4>{t.verify.scheduleTitle}</h4>
          <dl className="facts">
            <div>
              <dt>{t.verify.startsAt}</dt>
              <dd>{formatDateTime(internship.startTs, internship.periodSecs < 3600)}</dd>
            </div>
            <div>
              <dt>{t.verify.dayLength}</dt>
              <dd>{formatSpan(internship.periodSecs)}</dd>
            </div>
            <div>
              <dt>{t.verify.reviewWindow}</dt>
              <dd>{formatSpan(internship.reviewSecs)}</dd>
            </div>
            <div>
              <dt>{t.verify.progress}</dt>
              <dd>{progress}</dd>
            </div>
          </dl>
        </div>
      </div>

      <h4>{t.verify.totalsTitle}</h4>
      <dl className="stats">
        <div>
          <dt>{t.verify.submitted}</dt>
          <dd>{internship.submittedCount}</dd>
        </div>
        <div>
          <dt>{t.verify.approved}</dt>
          <dd>{internship.approvedCount}</dd>
        </div>
        <div>
          <dt>{t.verify.autoApproved}</dt>
          <dd>{internship.autoApprovedCount}</dd>
        </div>
        <div>
          <dt>{t.verify.rejected}</dt>
          <dd>{internship.rejectedCount}</dd>
        </div>
        <div>
          <dt>{t.verify.missing}</dt>
          <dd>{missing}</dd>
        </div>
        {internship.stipendPerPeriod > 0n && (
          <div>
            <dt>{t.verify.stipendPaid}</dt>
            <dd>{formatSol(BigInt(internship.paidCount) * internship.stipendPerPeriod)}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
