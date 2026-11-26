import type { PublicKey } from '@solana/web3.js';
import { AddressLink } from '../../components/AddressLink';
import { CopyButton } from '../../components/CopyButton';
import { explorerTx } from '../../lib/explorer';
import { shortAddress } from '../../lib/format';
import { shareLink } from '../../lib/url';
import { t } from '../../strings';

/** After registering: the shareable ?i=<internship address> link and the transaction. */
export function RegisterSuccess(props: {
  address: PublicKey;
  signature: string;
  onOpenVerify: (internship: string) => void;
  onAnother: () => void;
}) {
  const { address, signature, onOpenVerify, onAnother } = props;
  const link = shareLink(address);

  return (
    <section className="card success" aria-labelledby="register-success">
      <h3 id="register-success">{t.register.successTitle}</h3>
      <p>{t.register.successText}</p>

      <div className="field">
        <label htmlFor="share-link">{t.register.shareLabel}</label>
        <div className="input-row">
          <input id="share-link" className="mono" readOnly value={link} onFocus={(event) => event.target.select()} />
          <CopyButton text={link} />
        </div>
      </div>

      <dl className="facts">
        <div>
          <dt>{t.register.addressLabel}</dt>
          <dd>
            <AddressLink address={address} chars={8} />
          </dd>
        </div>
        <div>
          <dt>{t.tx.viewTx}</dt>
          <dd>
            <a className="mono" href={explorerTx(signature)} target="_blank" rel="noreferrer">
              {shortAddress(signature, 8)}
            </a>
          </dd>
        </div>
      </dl>

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={() => onOpenVerify(address.toBase58())}>
          {t.register.openVerify}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onAnother}>
          {t.register.another}
        </button>
      </div>
    </section>
  );
}
