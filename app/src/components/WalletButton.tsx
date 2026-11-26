import { BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { t } from '../strings';

/** The wallet button (connect, copy address, change, disconnect), with Indonesian labels. */
export function WalletButton() {
  return <BaseWalletMultiButton labels={t.wallet.button} />;
}
