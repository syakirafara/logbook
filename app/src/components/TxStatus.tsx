import type { TxState } from '../hooks/useTx';
import { explorerTx } from '../lib/explorer';
import { t } from '../strings';
import { ErrorNote } from './ErrorNote';

const PHASE_TEXT = {
  simulating: t.tx.simulating,
  signing: t.tx.signing,
  confirming: t.tx.confirming,
  done: t.tx.done,
};

/** Shows how a transaction is going, its Explorer link once it has a signature, and any error. */
export function TxStatus({ tx }: { tx: TxState }) {
  if (tx.phase === 'idle') return null;
  return (
    <div className="tx-status" aria-live="polite">
      {tx.phase !== 'failed' && <p className={`tx-phase tx-${tx.phase}`}>{PHASE_TEXT[tx.phase]}</p>}
      {tx.signature && (
        <p>
          <a href={explorerTx(tx.signature)} target="_blank" rel="noreferrer">
            {t.tx.viewTx}
          </a>
        </p>
      )}
      {tx.error && <ErrorNote error={tx.error} />}
    </div>
  );
}
