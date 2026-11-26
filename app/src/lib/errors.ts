// Turning errors into messages people understand.
//
// When the program refuses something, Anchor writes the reason into the transaction logs, for example
// "Error Code: NotCurrentPeriod. Error Number: 6006". The IDL holds a readable message for each code
// (taken from the #[msg("...")] lines in lib.rs), so we show that message.
import { AnchorError, LangErrorCode, LangErrorMessage } from '@coral-xyz/anchor';
import { WalletError } from '@solana/wallet-adapter-base';
import { t } from '../strings';
import { IDL } from './paraf';

/** An error from our transaction helper (tx.ts). It keeps the program logs when there are any. */
export class TxError extends Error {
  /** Lines the program printed while running (from a simulation). */
  logs: string[];
  /** The raw error the RPC server returned, for example { InstructionError: [0, { Custom: 6006 }] }. */
  txError: unknown;
  /** Set when the transaction was sent, so people can look it up in Explorer. */
  signature?: string;
  expired: boolean;
  /** The wallet failed because the person waited too long before confirming (the blockhash expired). */
  tooSlow: boolean;

  constructor(
    message: string,
    details: { logs?: string[] | null; txError?: unknown; signature?: string; expired?: boolean; tooSlow?: boolean } = {},
  ) {
    super(message);
    this.name = 'TxError';
    this.logs = details.logs ?? [];
    this.txError = details.txError;
    this.signature = details.signature;
    this.expired = details.expired ?? false;
    this.tooSlow = details.tooSlow ?? false;
  }
}

/** What the app shows for an error. */
export interface FriendlyError {
  title: string;
  detail?: string;
  /** Program error number and name, for example 6006 / NotCurrentPeriod. */
  code?: number;
  name?: string;
  logs?: string[];
}

// Error number -> name and message, from the IDL (our program's errors start at 6000).
const programErrors = new Map((IDL.errors ?? []).map((error) => [error.code, error]));

/** Reads the error number out of { InstructionError: [index, { Custom: number }] }. */
function customErrorCode(txError: unknown): number | null {
  if (!txError || typeof txError !== 'object' || !('InstructionError' in txError)) return null;
  const [, inner] = (txError as { InstructionError: [number, unknown] }).InstructionError;
  if (inner && typeof inner === 'object' && 'Custom' in inner) return Number((inner as { Custom: number }).Custom);
  return null;
}

/** Wallets often report "custom program error: 0x1776" (0x1776 = 6006). */
function hexErrorCode(message: string): number | null {
  const match = /custom program error: (0x[0-9a-f]+)/i.exec(message);
  return match ? parseInt(match[1], 16) : null;
}

/** Describes a program error number, or returns null when it is not one we know. */
function describeCode(code: number, logs: string[]): FriendlyError | null {
  const own = programErrors.get(code);
  if (own) {
    const title = t.programErrors[own.name] ?? own.msg ?? own.name;
    return { title, detail: t.errors.programRule(own.name, code), code, name: own.name, logs };
  }
  // Errors from the Anchor framework itself, for example 3012 "account not initialized".
  const anchorMessage = LangErrorMessage.get(code);
  if (anchorMessage) {
    const name = Object.entries(LangErrorCode).find(([, value]) => value === code)?.[0];
    return { title: anchorMessage, detail: t.errors.anchorRule(code), code, name, logs };
  }
  return null;
}

export function explainError(error: unknown): FriendlyError {
  const message = error instanceof Error ? error.message : String(error);
  const logs = error instanceof TxError ? error.logs : [];
  const txError = error instanceof TxError ? error.txError : undefined;

  if (error instanceof TxError && error.tooSlow) return { title: t.errors.tooSlow, detail: t.errors.tooSlowHint };
  if (error instanceof TxError && error.expired) return { title: t.errors.expired };

  // 1. The program refused: find the error number in the logs, the raw error, or the message.
  const code = AnchorError.parse(logs)?.error.errorCode.number ?? customErrorCode(txError) ?? hexErrorCode(message);
  if (code !== null) {
    const described = describeCode(code, logs);
    if (described) return described;
  }

  // 2. Common problems that are not program errors.
  const everything = [message, JSON.stringify(txError ?? ''), ...logs].join('\n');
  if (/already in use/i.test(everything)) return { title: t.errors.alreadyExists, logs };
  // Check "ProgramAccountNotFound" before "AccountNotFound" (the second is part of the first).
  if (/ProgramAccountNotFound|program that does not exist|InvalidProgramForExecution/i.test(everything)) {
    return { title: t.errors.programMissing, logs };
  }
  // AccountNotFound / InvalidAccountForFee here mean the fee payer has never received any SOL.
  if (
    /\bAccountNotFound\b|InvalidAccountForFee|InsufficientFunds|insufficient lamports|insufficient funds|no record of a prior credit/i.test(
      everything,
    )
  ) {
    return { title: t.errors.noSol, logs };
  }
  if (error instanceof WalletError) {
    if (/reject|cancel|denied|declined/i.test(message)) return { title: t.errors.cancelled };
    return { title: t.errors.wallet, detail: [message, t.errors.walletHint].filter(Boolean).join(' ') };
  }
  if (/\b429\b|too many requests/i.test(everything)) return { title: t.errors.rateLimited };
  if (/failed to fetch|networkerror|fetch failed|load failed/i.test(everything)) return { title: t.errors.network };

  // 3. Anything else: show the raw error so it can be looked up.
  if (error instanceof TxError) return { title: t.errors.txFailed, detail: JSON.stringify(txError), logs };
  return { title: message || t.errors.unknown, logs };
}
