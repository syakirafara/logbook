// Helpers for the page address, for example https://…/?i=<internship address>&tab=verify
import type { PublicKey } from '@solana/web3.js';

export function getUrlParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

/** Changes one ?name=value in the address bar without reloading the page (null removes it). */
export function setUrlParam(name: string, value: string | null): void {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  window.history.replaceState(null, '', url);
}

/** The link that opens the Verify view for one internship. */
export function shareLink(internship: PublicKey | string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('i', typeof internship === 'string' ? internship : internship.toBase58());
  return url.toString();
}
