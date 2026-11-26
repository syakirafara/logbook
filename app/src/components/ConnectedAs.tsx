import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { AddressLink } from './AddressLink';
import { t } from '../strings';

/**
 * "Connected as AbCd…WxYz [Switch account]", shown at the top of the wallet views.
 *
 * Phantom only tells the page about an account switch when the new account was already connected
 * to this site. Otherwise the page keeps the old account, so this bar makes the account visible
 * and switching it one click: disconnect, then open the wallet picker again.
 */
export function ConnectedAs() {
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  if (!publicKey) return null;

  const switchAccount = async () => {
    await disconnect().catch(() => undefined);
    setVisible(true);
  };

  return (
    <div className="connected-as">
      <span>
        {t.wallet.connectedAs} <AddressLink address={publicKey} />
      </span>
      <button type="button" className="btn btn-secondary btn-small" onClick={switchAccount}>
        {t.wallet.switchAccount}
      </button>
    </div>
  );
}
