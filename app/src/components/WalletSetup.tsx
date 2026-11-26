import type { Adapter } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { ReactNode } from 'react';
import { RPC_URL } from '../config';

// Wallets that follow the "Wallet Standard" (Phantom, Solflare, Backpack and others) announce
// themselves to the page, so we do not need to list any here.
const wallets: Adapter[] = [];

/**
 * Connection = which Solana RPC server to talk to (devnet here).
 * WalletProvider = which wallet is connected (autoConnect reconnects the last one on reload).
 * WalletModalProvider = the "Select wallet" pop-up used by <WalletButton>.
 */
export function WalletSetup({ children }: { children: ReactNode }) {
  return (
    <ConnectionProvider endpoint={RPC_URL} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
