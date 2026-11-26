import type { PublicKey } from '@solana/web3.js';
import { explorerAddress } from '../lib/explorer';
import { shortAddress } from '../lib/format';

/** A shortened address that opens the account in Solana Explorer. The full address is in the tooltip. */
export function AddressLink({ address, chars = 4 }: { address: PublicKey | string; chars?: number }) {
  const text = typeof address === 'string' ? address : address.toBase58();
  return (
    <a className="mono" href={explorerAddress(text)} target="_blank" rel="noreferrer" title={text}>
      {shortAddress(text, chars)}
    </a>
  );
}
