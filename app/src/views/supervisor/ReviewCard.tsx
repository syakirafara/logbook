import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { AddressLink } from '../../components/AddressLink';
import { Countdown } from '../../components/Countdown';
import { TxStatus } from '../../components/TxStatus';
import { useParaf } from '../../hooks/useParaf';
import { useStamp } from '../../hooks/useStamp';
import { useTx } from '../../hooks/useTx';
import { formatDateTime } from '../../lib/format';
import { isEmptyHash } from '../../lib/hash';
import { reviewEntryIx } from '../../lib/instructions';
import type { Entry, Internship } from '../../lib/paraf';
import { reviewDeadline } from '../../lib/schedule';
import { t } from '../../strings';

/** One pending page with the time left, and Approve / Reject (review_entry). */
export function ReviewCard(props: { internship: Internship; entry: Entry; onDone: () => void }) {
  const { internship, entry, onDone } = props;
  const { program } = useParaf();
  const { publicKey } = useWallet();
  const tx = useTx();
  const { showStamp } = useStamp();
  const [reason, setReason] = useState(0);
  const day = entry.periodIndex + 1;
  const reasonId = `reason-${entry.address.toBase58()}`;

  const review = async (approve: boolean) => {
    if (!publicKey) return;
    const label = approve ? t.supervisor.txApprove(day) : t.supervisor.txReject(day);
    const signature = await tx.run(label, async () => [
      await reviewEntryIx(program, {
        internship: internship.address,
        entry: entry.address,
        supervisor: publicKey,
        approve,
        // A reason only makes sense for a rejection; approvals store 0 ("no reason").
        reasonCode: approve ? 0 : reason,
      }),
    ]);
    if (signature && approve) showStamp('approved');
    if (signature) onDone();
  };

  return (
    <article className="card review-card">
      <div className="review-head">
        <strong>{t.common.day(day)}</strong>
        <span>{internship.hostOrg}</span>
        <span className="muted">
          {t.supervisor.internLabel}: <AddressLink address={internship.intern} />
        </span>
      </div>
      <blockquote className="summary">{entry.summary}</blockquote>
      <p className="help">{isEmptyHash(entry.detailHash) ? t.supervisor.noFullText : t.supervisor.hasFullText}</p>
      <dl className="facts">
        <div>
          <dt>{t.supervisor.submittedAt}</dt>
          <dd>{formatDateTime(entry.submittedAt, internship.periodSecs < 3600)}</dd>
        </div>
        <div>
          <dt>{t.supervisor.timeLeft}</dt>
          <dd>
            <Countdown to={reviewDeadline(internship, entry)} />
          </dd>
        </div>
      </dl>
      <div className="review-actions">
        <button type="button" className="btn btn-approve" onClick={() => review(true)} disabled={tx.busy}>
          {t.supervisor.approve}
        </button>
        <div className="reject-group">
          <label htmlFor={reasonId} className="sr-only">
            {t.supervisor.reasonLabel}
          </label>
          <select
            id={reasonId}
            title={t.supervisor.reasonLabel}
            value={reason}
            onChange={(event) => setReason(Number(event.target.value))}
          >
            {t.reasons.map((label, code) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-reject" onClick={() => review(false)} disabled={tx.busy}>
            {t.supervisor.reject}
          </button>
        </div>
      </div>
      <TxStatus tx={tx} />
    </article>
  );
}
