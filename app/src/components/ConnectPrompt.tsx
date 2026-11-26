import { WalletButton } from './WalletButton';
import { t } from '../strings';

/** Shown in views that need a wallet, before one is connected. */
export function ConnectPrompt({ text }: { text: string }) {
  return (
    <div className="card connect-prompt">
      <p>{text}</p>
      <WalletButton />
      <p className="help">{t.wallet.phantomHint}</p>
      <p className="help">{t.wallet.faucetHint}</p>
    </div>
  );
}
