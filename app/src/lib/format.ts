// Turning raw values (addresses, seconds, lamports) into text people can read, and back.
import { PublicKey } from '@solana/web3.js';
import { t } from '../strings';

const LAMPORTS_PER_SOL = 1_000_000_000n;

/** A typed or pasted address, or null when it is not a valid Solana address. */
export function parseAddress(text: string | null): PublicKey | null {
  if (!text || !text.trim()) return null;
  try {
    return new PublicKey(text.trim());
  } catch {
    return null;
  }
}

/** "AbCd…WxYz": enough to recognise an address without filling the screen. */
export function shortAddress(address: PublicKey | string, chars = 4): string {
  const text = typeof address === 'string' ? address : address.toBase58();
  return text.length <= chars * 2 + 1 ? text : `${text.slice(0, chars)}…${text.slice(-chars)}`;
}

/** Countdown style: "2d 3h", "4h 05m", "3m 07s" or "42s". */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const { d, h, m, s: sec } = t.time.short;
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3_600);
  const minutes = Math.floor((s % 3_600) / 60);
  const seconds = s % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  if (days > 0) return `${days}${d} ${hours}${h}`;
  if (hours > 0) return `${hours}${h} ${two(minutes)}${m}`;
  if (minutes > 0) return `${minutes}${m} ${two(seconds)}${sec}`;
  return `${seconds}${sec}`;
}

/** Spoken style with at most two units: "1 day", "3 minutes", "1 hour 30 minutes". */
export function formatSpan(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const parts = [
    { amount: Math.floor(s / 86_400), word: t.time.day },
    { amount: Math.floor((s % 86_400) / 3_600), word: t.time.hour },
    { amount: Math.floor((s % 3_600) / 60), word: t.time.minute },
    { amount: s % 60, word: t.time.second },
  ].filter((part) => part.amount > 0);
  if (parts.length === 0) return t.time.second(0);
  return parts
    .slice(0, 2)
    .map((part) => part.word(part.amount))
    .join(' ');
}

/** Lamports as SOL, for example 1500000000n -> "1.5 SOL". bigint maths, so no rounding errors. */
export function formatSol(lamports: bigint): string {
  const whole = lamports / LAMPORTS_PER_SOL;
  const fraction = (lamports % LAMPORTS_PER_SOL).toString().padStart(9, '0').replace(/0+$/, '');
  return `${whole}${fraction ? `.${fraction}` : ''} SOL`;
}

/** "0.05" (SOL) -> 50000000n lamports. Returns null when the text is not a valid amount. */
export function parseSol(text: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{0,9}))?$/.exec(text.trim());
  if (!match) return null;
  const whole = match[1];
  const fraction = match[2] ?? '';
  return BigInt(whole) * LAMPORTS_PER_SOL + BigInt(fraction.padEnd(9, '0'));
}

/** The words for a supervisor's reason code (0 none, 1 absent, 2 incomplete, 3 other). */
export function reasonLabel(code: number): string {
  return t.reasons[code] ?? t.unknownReason(code);
}

/** Date and time in the viewer's time zone, Indonesian style. Seconds help with short demo days. */
export function formatDateTime(unixSeconds: number, withSeconds = false): string {
  return new Date(unixSeconds * 1000).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: withSeconds ? 'medium' : 'short',
  });
}
