import { PROGRAM_ID } from '../config';
import { useChainClock } from '../hooks/useChainClock';
import { t } from '../strings';
import { AddressLink } from './AddressLink';

export function Footer() {
  const { offset, synced } = useChainClock();
  return (
    <footer className="footer">
      <p>{t.footer.public}</p>
      <p className="footer-meta">
        {PROGRAM_ID && (
          <span>
            {t.footer.program}: <AddressLink address={PROGRAM_ID} />
          </span>
        )}
        <span>{synced ? t.footer.clockOffset(offset) : t.footer.clockSyncing}</span>
      </p>
    </footer>
  );
}
