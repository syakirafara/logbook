// Small helpers for turning numbers and text into bytes, the way Rust does it.

/** A u64 as 8 bytes, little-endian: the same bytes as Rust's `value.to_le_bytes()`. */
export function u64LE(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, value, true); // true = little-endian
  return bytes;
}

/** A u16 as 2 bytes, little-endian: the same bytes as Rust's `value.to_le_bytes()`. */
export function u16LE(value: number): Uint8Array {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

/** Text as UTF-8 bytes. Rust strings are UTF-8, so limits like "160 bytes" count these bytes. */
export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** How many bytes the text takes on-chain. Letters like "é" take 2 bytes, many emoji take 4. */
export function byteLength(text: string): number {
  return utf8(text).length;
}

/** Bytes as a hex string, for example "3fa2…". */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A hex string back to bytes, or null when it is not valid hex. */
export function fromHex(hex: string): Uint8Array | null {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) return null;
  return Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16));
}

/** True when both byte arrays hold the same values. */
export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}
