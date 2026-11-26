import { useWallet } from '@solana/wallet-adapter-react';
import { TxStatus } from '../../components/TxStatus';
import { useChainClock } from '../../hooks/useChainClock';
import { useParaf } from '../../hooks/useParaf';
import { useTx } from '../../hooks/useTx';
import { formatSol } from '../../lib/format';
import { claimStipendIx } from '../../lib/instructions';
import type { Entry, Internship } from '../../lib/paraf';
import { dayState } from '../../lib/schedule';
import { t } from '../../strings';

interface Props {
  internship: Internship;
  entries: (Entry | null)[];
  onChanged: () => void;
}

/** The stipend: what is claimable now (approved but unpaid days) and the Claim button (claim_stipend). */
export function StipendCard({ internship, entries, onChanged }: Props) {
  const { now } = useChainClock();
  const { program } = useParaf();
  const { publicKey } = useWallet();
  const tx = useTx();

  // Same maths as claim_stipend in lib.rs: (approved_count - paid_count) * stipend_per_period.
  const unpaidDays = Math.max(internship.approvedCount - internship.paidCount, 0);
  const claimable = BigInt(unpaidDays) * internship.stipendPerPeriod;
  // The whole stipend was locked at registration; only claims take it out.
  const stillLocked = BigInt(internship.totalPeriods - internship.paidCount) * internship.stipendPerPeriod;
  // Silent pages only count once someone finalizes them.
  const silentCount = entries.filter((entry, day) => entry && dayState(internship, entry, day, now) === 'silent').length;

  const claim = async () => {
    if (!publicKey) return;
    const signature = await tx.run(t.intern.txClaim, async () => [
      await claimStipendIx(program, { internship: internship.address, intern: publicKey }),
    ]);
    if (signature) onChanged();
  };

  return (
    <section className="card" aria-labelledby="stipend-title">
      <h3 id="stipend-title">{t.intern.stipendTitle}</h3>
      <dl className="stats">
        <div>
          <dt>{t.intern.stipendPerDay}</dt>
          <dd>{formatSol(internship.stipendPerPeriod)}</dd>
        </div>
        <div>
          <dt>{t.intern.approvedDays}</dt>
          <dd>{internship.approvedCount}</dd>
        </div>
        <div>
          <dt>{t.intern.paidDays}</dt>
          <dd>{internship.paidCount}</dd>
        </div>
        <div>
          <dt>{t.intern.claimable}</dt>
          <dd>{formatSol(claimable)}</dd>
        </div>
        <div>
          <dt>{t.intern.stillLocked}</dt>
          <dd>{formatSol(stillLocked)}</dd>
        </div>
      </dl>
      {silentCount > 0 && <p className="note">{t.intern.finalizeFirst(silentCount)}</p>}
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={claim} disabled={claimable === 0n || tx.busy}>
          {t.intern.claim} {claimable > 0n && `(${formatSol(claimable)})`}
        </button>
      </div>
      <TxStatus tx={tx} />
    </section>
  );
}
