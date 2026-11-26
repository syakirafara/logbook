import { useWallet } from '@solana/wallet-adapter-react';
import { useParaf } from '../hooks/useParaf';
import { useStamp } from '../hooks/useStamp';
import { useTx } from '../hooks/useTx';
import { finalizeEntryIx } from '../lib/instructions';
import type { Entry, Internship } from '../lib/paraf';
import { t } from '../strings';
import { TxStatus } from './TxStatus';

/**
 * "Silence = approval": after the review window closes, ANY wallet can finalize a pending page.
 * The connected wallet only pays the tiny network fee; it does not need to be the intern or supervisor.
 */
export function FinalizeButton(props: { internship: Internship; entry: Entry; onDone?: () => void }) {
  const { internship, entry, onDone } = props;
  const { program } = useParaf();
  const { connected } = useWallet();
  const tx = useTx();
  const { showStamp } = useStamp();

  const finalize = async () => {
    const signature = await tx.run(t.finalize.tx(entry.periodIndex + 1), async () => [
      await finalizeEntryIx(program, { internship: internship.address, entry: entry.address }),
    ]);
    if (signature) showStamp('autoApproved');
    if (signature) onDone?.();
  };

  return (
    <div className="finalize">
      <button type="button" className="btn btn-secondary" onClick={finalize} disabled={!connected || tx.busy}>
        {t.finalize.button}
      </button>
      {!connected && <p className="help">{t.finalize.needWallet}</p>}
      <TxStatus tx={tx} />
    </div>
  );
}
