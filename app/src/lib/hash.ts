// Fingerprints for the private full text. Only the fingerprint (a SHA-256 hash) goes on-chain.
//
// fingerprint = SHA-256(salt + text). The salt is 16 random bytes, made fresh for every page.
// Why a salt? Everything on-chain is public. Without a salt, anyone could hash guesses such as
// "Sick" and compare them with the fingerprint, which would reveal short texts. With a salt, a
// guess only works together with the salt, and only the intern has it.
//
// The intern keeps the salt and the text together in one saved file (see proofFileText below).
// With that file, anyone can later check that the text is exactly what was fingerprinted.
import { t } from '../strings';
import { fromHex, toHex, utf8 } from './bytes';

/** 32 zero bytes: stored when the intern attaches no full text. */
export const EMPTY_HASH = new Uint8Array(32);

/** How many random bytes a salt has. */
export const SALT_BYTES = 16;

/** A fresh random salt from the browser's secure random number generator. */
export function newSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

/**
 * The canonical form of a text, so invisible differences do not change the fingerprint:
 * Windows line endings (CRLF) become LF, and spaces and blank lines at the start and end are removed.
 */
export function normaliseText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

/** SHA-256 of (salt + normalised text), computed in this browser. The text itself is never sent anywhere. */
export async function fingerprint(salt: Uint8Array, text: string): Promise<Uint8Array> {
  // crypto.subtle only exists on secure pages (https:// or localhost).
  if (!globalThis.crypto?.subtle) throw new Error(t.errors.insecureHash);
  const textBytes = utf8(normaliseText(text));
  const input = new Uint8Array(salt.length + textBytes.length);
  input.set(salt); // first the salt...
  input.set(textBytes, salt.length); // ...then the text right after it
  return new Uint8Array(await crypto.subtle.digest('SHA-256', input));
}

export function isEmptyHash(hash: Uint8Array): boolean {
  return hash.every((byte) => byte === 0);
}

// ---------------------------------------------------------------------------
// The page file: what the intern saves to prove a page later.
// ---------------------------------------------------------------------------

/** Everything needed to prove one page. */
export interface PageProof {
  /** The internship account address. */
  internship: string;
  /** The day as shown in the app (day 1 is period 0). */
  day: number;
  salt: Uint8Array;
  /** The normalised full text. */
  text: string;
}

const SALT_LABEL = 'Salt:';
const TEXT_LINE = '--- Full text (everything below this line) ---';

/** The file's contents. Plain text, so it opens in any text editor. */
export function proofFileText(proof: PageProof): string {
  return [
    'Paraf page file. Keep it private: it holds your full text.',
    `Internship: ${proof.internship}`,
    `Day: ${proof.day}`,
    `${SALT_LABEL} ${toHex(proof.salt)}`,
    TEXT_LINE,
    proof.text,
    '',
  ].join('\n');
}

/** Reads a saved page file back into its salt and text. Returns null when it is not a Paraf page file. */
export function readProofFile(fileText: string): { salt: Uint8Array; text: string } | null {
  const lines = fileText.replace(/\r\n/g, '\n').split('\n');
  const textLine = lines.findIndex((line) => line.trim() === TEXT_LINE);
  if (textLine < 0) return null;
  // The salt is in the lines above the text, written as hex ("3fa2…").
  const saltLine = lines.slice(0, textLine).find((line) => line.startsWith(SALT_LABEL));
  const salt = saltLine ? fromHex(saltLine.slice(SALT_LABEL.length).trim()) : null;
  if (!salt || salt.length !== SALT_BYTES) return null;
  return { salt, text: lines.slice(textLine + 1).join('\n') };
}
