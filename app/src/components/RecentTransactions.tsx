import { useTxLog } from '../hooks/useTxLog';
import { explorerTx } from '../lib/explorer';
import { shortAddress } from '../lib/format';
import { t } from '../strings';

/** A small stack in the corner with the latest transactions and their Explorer links. */
export function RecentTransactions() {
  const { items, dismiss } = useTxLog();
  return (
    <section className="toasts" aria-label={t.tx.recent} aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toast ${item.ok ? 'toast-ok' : 'toast-failed'}`}>
          <div className="toast-text">
            <strong>{item.label}</strong>
            <span>{item.ok ? t.tx.done : t.tx.failed}</span>
            <a href={explorerTx(item.signature)} target="_blank" rel="noreferrer">
              {t.tx.viewTx} <span className="mono">{shortAddress(item.signature, 6)}</span>
            </a>
          </div>
          <button type="button" className="icon-button" onClick={() => dismiss(item.id)} aria-label={t.tx.dismiss}>
            ×
          </button>
        </div>
      ))}
    </section>
  );
}
