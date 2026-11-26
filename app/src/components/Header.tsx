import { WalletButton } from './WalletButton';
import { t } from '../strings';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark">
            <Logo size={34} />
          </span>
          <div>
            <h1 className="brand-name">{t.app.name}</h1>
            <p className="tagline">{t.app.tagline}</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="network-badge">{t.app.network}</span>
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
