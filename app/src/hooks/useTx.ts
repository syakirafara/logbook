import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import type { TransactionInstruction } from '@solana/web3.js';
import { useCallback, useState } from 'react';
import { explainError, TxError, type FriendlyError } from '../lib/errors';
import { sendInstructions, type TxStep } from '../lib/tx';
import { t } from '../strings';
import { useTxLog } from './useTxLog';

export type TxPhase = 'idle' | TxStep | 'done' | 'failed';

export interface TxState {
  phase: TxPhase;
  signature?: string;
  error?: FriendlyError;
}

/**
 * Runs one kind of transaction for a button and remembers how it went (for <TxStatus>).
 * Every sent transaction is also added to the "Recent transactions" list.
 */
export function useTx() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { add } = useTxLog();
  const [state, setState] = useState<TxState>({ phase: 'idle' });

  /** Builds the instructions, then simulates, signs, sends and confirms. Returns the signature, or null. */
  const run = useCallback(
    async (label: string, build: () => Promise<TransactionInstruction[]>): Promise<string | null> => {
      if (!publicKey) {
        setState({ phase: 'failed', error: { title: t.errors.connectFirst } });
        return null;
      }
      let signature: string | undefined;
      try {
        setState({ phase: 'simulating' });
        const instructions = await build();
        signature = await sendInstructions({
          connection,
          payer: publicKey,
          sendTransaction,
          instructions,
          onStep: (phase, sentSignature) => {
            signature = sentSignature ?? signature;
            setState({ phase, signature });
          },
        });
        setState({ phase: 'done', signature });
        add({ label, signature, ok: true });
        return signature;
      } catch (error) {
        signature = signature ?? (error instanceof TxError ? error.signature : undefined);
        setState({ phase: 'failed', signature, error: explainError(error) });
        if (signature) add({ label, signature, ok: false });
        return null;
      }
    },
    [connection, publicKey, sendTransaction, add],
  );

  const reset = useCallback(() => setState({ phase: 'idle' }), []);
  const busy = state.phase === 'simulating' || state.phase === 'signing' || state.phase === 'confirming';

  return { ...state, busy, run, reset };
}
