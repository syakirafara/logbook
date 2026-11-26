// Links to Solana Explorer, where anyone can inspect a transaction or an account.
// `?cluster=devnet` tells Explorer to look on the devnet test network.
import type { PublicKey } from '@solana/web3.js';

export function explorerTx(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function explorerAddress(address: PublicKey | string): string {
  const text = typeof address === 'string' ? address : address.toBase58();
  return `https://explorer.solana.com/address/${text}?cluster=devnet`;
}
