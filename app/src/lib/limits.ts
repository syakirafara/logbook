// Limits copied from the program (program/src/lib.rs). The program enforces them anyway;
// the app checks them first so people get a clear message before signing anything.
// If you change a limit in lib.rs, change it here too.

/** MAX_HOST_ORG_LEN: longest host organisation name, in bytes. */
export const MAX_HOST_ORG_BYTES = 40;
/** MAX_SUMMARY_LEN: longest public page summary, in bytes. */
export const MAX_SUMMARY_BYTES = 160;
/** MIN_WINDOW_SECS: shortest day length / review window, in seconds. */
export const MIN_WINDOW_SECS = 10;
/** MAX_WINDOW_SECS: longest day length / review window, in seconds (31 days). */
export const MAX_WINDOW_SECS = 31 * 24 * 60 * 60;
/** MAX_PERIODS: most days (pages) in one internship. */
export const MAX_PERIODS = 400;
/** START_GRACE_SECS: a chosen start time may be at most this far in the past (5 minutes). */
export const START_GRACE_SECS = 5 * 60;
/** MAX_START_AHEAD_SECS: a chosen start time may be at most this far in the future (366 days). */
export const MAX_START_AHEAD_SECS = 366 * 24 * 60 * 60;

/** The app stops offering Submit this many seconds before a day ends (the chain clock may be ahead). */
export const SUBMIT_CUTOFF_SECS = 15;
