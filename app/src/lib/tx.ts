// Sending transactions: check first, then sign, then wait for confirmation.
//
// 1. Simulate: an RPC server runs the transaction against the current chain state but saves nothing.
//    If the program would refuse, we show its reason and the wallet is never even asked.
// 2. Sign and send: the wallet shows the transaction to the user, signs it and sends it.
// 3. Confirm: we wait until the network has "confirmed" it (a supermajority of validators voted on it).
import type { WalletContextState } from '@solana/wallet-adapter-react';
import {
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  type Connection,
  type PublicKey,
  type TransactionError,
  type TransactionInstruction,
} from '@solana/web3.js';
import { TxError } from './errors';

export type TxStep = 'simulating' | 'signing' | 'confirming';

export interface SimulationResult {
  ok: boolean;
  err: TransactionError | string | null;
  logs: string[];
}

// Any valid value works here: `replaceRecentBlockhash: true` asks the server to put in a fresh one.
const PLACEHOLDER_BLOCKHASH = '11111111111111111111111111111111';

/**
 * Runs instructions as a simulation. `sigVerify: false` means nobody has to sign, so this works
 * without asking the wallet (we use it for the "try to backdate" demo too).
 */
export async function simulateInstructions(
  connection: Connection,
  payer: PublicKey,
  instructions: TransactionInstruction[],
): Promise<SimulationResult> {
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: PLACEHOLDER_BLOCKHASH,
    instructions,
  }).compileToLegacyMessage();
  const { value } = await connection.simulateTransaction(new VersionedTransaction(message), {
    sigVerify: false,
    replaceRecentBlockhash: true,
    commitment: 'confirmed',
  });
  return { ok: value.err === null, err: value.err, logs: value.logs ?? [] };
}

export interface SendParams {
  connection: Connection;
  /** The connected wallet: it pays the fee and signs. */
  payer: PublicKey;
  sendTransaction: WalletContextState['sendTransaction'];
  instructions: TransactionInstruction[];
  /** Called when the next step starts, so the screen can say what is happening. */
  onStep: (step: TxStep, signature?: string) => void;
}

/** After this long in the wallet's pop-up, a failure is almost always an expired blockhash. */
const SLOW_CONFIRM_MS = 45_000;

async function blockhashExpired(connection: Connection, lastValidBlockHeight: number): Promise<boolean> {
  try {
    return (await connection.getBlockHeight('confirmed')) > lastValidBlockHeight;
  } catch {
    return false;
  }
}

/** Simulates, then lets the wallet sign and send, then waits for confirmation. Returns the signature. */
export async function sendInstructions({
  connection,
  payer,
  sendTransaction,
  instructions,
  onStep,
}: SendParams): Promise<string> {
  onStep('simulating');
  const simulation = await simulateInstructions(connection, payer, instructions);
  if (!simulation.ok) {
    throw new TxError('Simulation failed', { logs: simulation.logs, txError: simulation.err });
  }

  onStep('signing');
  // The blockhash works like an expiry date: the network drops the transaction after about 60-90 s.
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({ feePayer: payer, blockhash, lastValidBlockHeight }).add(...instructions);
  const askedAt = Date.now();
  let signature: string;
  try {
    signature = await sendTransaction(transaction, connection);
  } catch (error) {
    // Phantom only says "Unexpected error" when the person confirmed after the blockhash expired.
    // If they waited long, or the blockhash is no longer valid, say that instead.
    const message = error instanceof Error ? error.message : String(error);
    const cancelled = /reject|cancel|denied|declined/i.test(message);
    if (!cancelled && (Date.now() - askedAt > SLOW_CONFIRM_MS || (await blockhashExpired(connection, lastValidBlockHeight)))) {
      throw new TxError('Wallet confirmed too late', { tooSlow: true });
    }
    throw error;
  }

  onStep('confirming', signature);
  await waitForConfirmation(connection, signature, lastValidBlockHeight);
  return signature;
}

/**
 * Waits until the transaction is confirmed. The RPC server pushes a message over a websocket when it
 * is; every 5 s we also ask once ourselves, in case that message gets lost. Stops when the
 * transaction can no longer land (its blockhash expired).
 */
export function waitForConfirmation(
  connection: Connection,
  signature: string,
  lastValidBlockHeight: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let finished = false;
    let subscribed = true;

    const finish = (error?: TxError) => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      if (subscribed) connection.removeSignatureListener(subscription).catch(() => undefined);
      if (error) reject(error);
      else resolve();
    };
    const failed = (txError: unknown) => new TxError('Transaction failed', { txError, signature });

    const subscription = connection.onSignature(
      signature,
      (result) => {
        subscribed = false; // the server removes this one-time subscription by itself
        finish(result.err ? failed(result.err) : undefined);
      },
      'confirmed',
    );

    const timer = setInterval(async () => {
      try {
        const { value } = await connection.getSignatureStatuses([signature]);
        const status = value[0];
        if (status?.err) return finish(failed(status.err));
        if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') return finish();
        const blockHeight = await connection.getBlockHeight('confirmed');
        if (blockHeight > lastValidBlockHeight) finish(new TxError('Transaction expired', { signature, expired: true }));
      } catch {
        // A network hiccup: try again on the next tick.
      }
    }, 5_000);
  });
}
