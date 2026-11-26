// The Register form: its presets, its starting values and its checks.
// The checks mirror register_internship in lib.rs, so mistakes show up before anyone signs.
import { PublicKey } from '@solana/web3.js';
import { byteLength } from '../../lib/bytes';
import { parseSol } from '../../lib/format';
import {
  MAX_HOST_ORG_BYTES,
  MAX_PERIODS,
  MAX_START_AHEAD_SECS,
  MAX_WINDOW_SECS,
  MIN_WINDOW_SECS,
  START_GRACE_SECS,
} from '../../lib/limits';
import { t } from '../../strings';

/** Day length choices, in seconds (null = type your own). */
export const DAY_PRESETS = { real: 86_400, demo: 180, custom: null } as const;
export type DayPreset = keyof typeof DAY_PRESETS;

/** Review window choices, in seconds (null = type your own). */
export const REVIEW_PRESETS = { twoDays: 172_800, oneDay: 86_400, demo: 120, custom: null } as const;
export type ReviewPreset = keyof typeof REVIEW_PRESETS;

/** What the inputs hold. Everything is text, exactly as typed. */
export interface RegisterForm {
  intern: string;
  supervisor: string;
  hostOrg: string;
  startMode: 'now' | 'later';
  /** Value of <input type="datetime-local">, in the viewer's time zone. */
  startAt: string;
  dayPreset: DayPreset;
  customDaySecs: string;
  reviewPreset: ReviewPreset;
  customReviewSecs: string;
  days: string;
  stipendSol: string;
}

export const EMPTY_FORM: RegisterForm = {
  intern: '',
  supervisor: '',
  hostOrg: '',
  startMode: 'now',
  startAt: '',
  dayPreset: 'real',
  customDaySecs: '600',
  reviewPreset: 'twoDays',
  customReviewSecs: '300',
  days: '20',
  stipendSol: '',
};

/** Checked values, ready for the instruction. */
export interface RegisterValues {
  intern: PublicKey;
  supervisor: PublicKey;
  hostOrg: string;
  /** 0 = start now (the program then uses the chain clock). */
  startTs: number;
  periodSecs: number;
  reviewSecs: number;
  totalPeriods: number;
  /** Lamports per approved day. */
  stipendPerPeriod: bigint;
}

export type FormErrors = Partial<Record<keyof RegisterForm, string>>;

/** A wallet address, or an error message. */
function parseWallet(text: string): PublicKey | string {
  let key: PublicKey;
  try {
    key = new PublicKey(text.trim());
  } catch {
    return t.register.errors.address;
  }
  // Wallet addresses are points on the ed25519 curve. PDAs are deliberately off the curve,
  // which means nobody holds a private key for them, so they could never sign as intern or supervisor.
  if (!PublicKey.isOnCurve(key.toBytes())) return t.register.errors.notWallet;
  return key;
}

/** A whole number between min and max, or null. */
function parseWholeNumber(text: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const value = Number(text.trim());
  return value >= min && value <= max ? value : null;
}

/** "YYYY-MM-DDTHH:mm" in local time, the format <input type="datetime-local"> uses. */
export function toLocalInput(date: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

/** `now` is the blockchain time in Unix seconds (from the chain clock), the clock the program uses. */
export function checkForm(form: RegisterForm, now: number): { errors: FormErrors; values: RegisterValues | null } {
  const errors: FormErrors = {};
  const e = t.register.errors;

  const intern = parseWallet(form.intern);
  if (typeof intern === 'string') errors.intern = intern;
  const supervisor = parseWallet(form.supervisor);
  if (typeof supervisor === 'string') errors.supervisor = supervisor;
  else if (typeof intern !== 'string' && intern.equals(supervisor)) errors.supervisor = e.sameWallet;

  const hostOrg = form.hostOrg.trim();
  const hostOrgBytes = byteLength(hostOrg);
  if (hostOrgBytes === 0) errors.hostOrg = e.hostOrgEmpty;
  else if (hostOrgBytes > MAX_HOST_ORG_BYTES) errors.hostOrg = e.hostOrgLong(hostOrgBytes, MAX_HOST_ORG_BYTES);

  let startTs = 0;
  if (form.startMode === 'later') {
    const ms = new Date(form.startAt).getTime();
    if (!form.startAt || Number.isNaN(ms)) errors.startAt = e.startAt;
    else {
      // The program wants seconds, not milliseconds.
      startTs = Math.floor(ms / 1000);
      // Same limits as register_internship in lib.rs: at most 5 minutes ago, at most 366 days ahead.
      if (startTs < now - START_GRACE_SECS) errors.startAt = e.startPast;
      else if (startTs > now + MAX_START_AHEAD_SECS) errors.startAt = e.startTooFar;
    }
  }

  const periodSecs = DAY_PRESETS[form.dayPreset] ?? parseWholeNumber(form.customDaySecs, MIN_WINDOW_SECS, MAX_WINDOW_SECS);
  if (periodSecs === null) errors.customDaySecs = e.seconds(MIN_WINDOW_SECS, MAX_WINDOW_SECS);

  const reviewSecs =
    REVIEW_PRESETS[form.reviewPreset] ?? parseWholeNumber(form.customReviewSecs, MIN_WINDOW_SECS, MAX_WINDOW_SECS);
  if (reviewSecs === null) errors.customReviewSecs = e.seconds(MIN_WINDOW_SECS, MAX_WINDOW_SECS);

  const totalPeriods = parseWholeNumber(form.days, 1, MAX_PERIODS);
  if (totalPeriods === null) errors.days = e.days(MAX_PERIODS);

  const stipendPerPeriod = form.stipendSol.trim() === '' ? 0n : parseSol(form.stipendSol);
  if (stipendPerPeriod === null) errors.stipendSol = e.stipend;

  if (
    Object.keys(errors).length > 0 ||
    typeof intern === 'string' ||
    typeof supervisor === 'string' ||
    periodSecs === null ||
    reviewSecs === null ||
    totalPeriods === null ||
    stipendPerPeriod === null
  ) {
    return { errors, values: null };
  }
  return {
    errors,
    values: { intern, supervisor, hostOrg, startTs, periodSecs, reviewSecs, totalPeriods, stipendPerPeriod },
  };
}
