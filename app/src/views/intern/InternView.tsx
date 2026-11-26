import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { ConnectPrompt } from '../../components/ConnectPrompt';
import { ErrorNote } from '../../components/ErrorNote';
import { InternshipPicker } from '../../components/InternshipPicker';
import { ConnectedAs } from '../../components/ConnectedAs';
import { RoleHeader } from '../../components/RoleHeader';
import { useParaf } from '../../hooks/useParaf';
import { usePolledData } from '../../hooks/usePolledData';
import { explainError } from '../../lib/errors';
import { listInternshipsByIntern } from '../../lib/paraf';
import { getUrlParam } from '../../lib/url';
import { t } from '../../strings';
import { InternLogbook } from './InternLogbook';

/** Intern view: find the internships of the connected wallet, then show the chosen logbook. */
export function InternView() {
  const { publicKey } = useWallet();
  const { program } = useParaf();
  // A shared link (?i=<address>) preselects that internship.
  const [chosen, setChosen] = useState<string | null>(() => getUrlParam('i'));

  // The list changes rarely (only when someone registers a new internship), so once a minute is enough.
  const list = usePolledData(
    publicKey ? `intern-list:${publicKey.toBase58()}` : null,
    () => (publicKey ? listInternshipsByIntern(program, publicKey) : Promise.resolve([])),
    60_000,
  );

  if (!publicKey) {
    return (
      <>
        <RoleHeader role="intern" />
        <ConnectPrompt text={t.wallet.connectIntern} />
      </>
    );
  }

  // Newest internship first.
  const internships = [...(list.data ?? [])].sort((a, b) => b.startTs - a.startTs);
  const selected = internships.find((internship) => internship.address.toBase58() === chosen) ?? internships[0];

  return (
    <>
      <RoleHeader role="intern" />
      <ConnectedAs />
      {list.error !== undefined && <ErrorNote error={explainError(list.error)} />}
      {!list.data && list.loading && <p className="muted">{t.common.loading}</p>}
      {list.data && internships.length === 0 && (
        <div className="card empty">
          <h3>{t.intern.noneTitle}</h3>
          <p>{t.intern.noneText}</p>
          <p className="help">{t.wallet.switchHint}</p>
        </div>
      )}
      {selected && (
        <>
          <InternshipPicker
            internships={internships}
            selected={selected.address.toBase58()}
            onSelect={setChosen}
          />
          <InternLogbook key={selected.address.toBase58()} address={selected.address} />
        </>
      )}
    </>
  );
}
