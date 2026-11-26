// Time maths for an internship. It mirrors the program (lib.rs), so the app shows exactly what the
// program will accept. All times are Unix seconds from the blockchain clock (see chainClock.ts).
import type { Entry, EntryStatus, Internship } from './paraf';

/**
 * Which day it is at `now`, counted from 0. Same formula as lib.rs:
 * `(now - start_ts) / period_secs`. Gives -1 before the start, and totalPeriods or more after the end.
 */
export function currentPeriod(internship: Internship, now: number): number {
  if (now < internship.startTs) return -1;
  return Math.floor((now - internship.startTs) / internship.periodSecs);
}

export type Phase = 'notStarted' | 'active' | 'ended';

export function phaseOf(internship: Internship, now: number): Phase {
  const day = currentPeriod(internship, now);
  if (day < 0) return 'notStarted';
  if (day >= internship.totalPeriods) return 'ended';
  return 'active';
}

/** How many days have begun so far: 0 before the start, totalPeriods once it has ended. */
export function startedDays(internship: Internship, now: number): number {
  return Math.min(Math.max(currentPeriod(internship, now) + 1, 0), internship.totalPeriods);
}

/** When day `index` begins (Unix seconds). */
export function periodStart(internship: Internship, index: number): number {
  return internship.startTs + index * internship.periodSecs;
}

/** When day `index` ends, which is when the next day begins. */
export function periodEnd(internship: Internship, index: number): number {
  return periodStart(internship, index + 1);
}

/** The last second the supervisor can review. lib.rs: `now <= submitted_at + review_secs`. */
export function reviewDeadline(internship: Internship, entry: Entry): number {
  return entry.submittedAt + internship.reviewSecs;
}

/** The supervisor can still approve or reject this page. */
export function canReview(internship: Internship, entry: Entry, now: number): boolean {
  return entry.status === 'pending' && now <= reviewDeadline(internship, entry);
}

/** The window closed without a decision, so anyone can finalize. lib.rs: `now > submitted_at + review_secs`. */
export function canFinalize(internship: Internship, entry: Entry, now: number): boolean {
  return entry.status === 'pending' && now > reviewDeadline(internship, entry);
}

/**
 * What to show for one day: the page status from the chain, or
 * 'silent' (pending, but the review window has closed), 'missing' (a past day without a page),
 * 'today' (today's page is not written yet) or 'upcoming'.
 */
export type DayState = EntryStatus | 'silent' | 'missing' | 'today' | 'upcoming';

export function dayState(internship: Internship, entry: Entry | null | undefined, index: number, now: number): DayState {
  if (entry) return canFinalize(internship, entry, now) ? 'silent' : entry.status;
  const today = currentPeriod(internship, now);
  if (index > today) return 'upcoming';
  if (index === today) return 'today';
  return 'missing';
}
