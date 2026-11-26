import type { PublicKey } from '@solana/web3.js';
import { AddressLink } from '../../components/AddressLink';
import { ErrorNote } from '../../components/ErrorNote';
import { useChainClock } from '../../hooks/useChainClock';
import { useParaf } from '../../hooks/useParaf';
import { usePolledData } from '../../hooks/usePolledData';
import { explainError } from '../../lib/errors';
import { fetchEntries, fetchInternship, isSelfRegistered } from '../../lib/paraf';
import { shareLink } from '../../lib/url';
import { t } from '../../strings';
import { BackdateDemo } from './BackdateDemo';
import { HistoryList } from './HistoryList';
import { StipendCard } from './StipendCard';
import { TodayCard } from './TodayCard';

/** One internship from the intern's side: today's page, stipend, history and the backdating demo. */
export function InternLogbook({ address }: { address: PublicKey }) {
  const { connection, program } = useParaf();
  const { getNow } = useChainClock();

  // Two requests every 15 s: the internship account, then its pages (100 per request).
  const logbook = usePolledData(
    `intern-logbook:${address.toBase58()}`,
    async () => {
      const internship = await fetchInternship(connection, program, address);
      if (!internship) return null;
      const entries = await fetchEntries(connection, program, internship, getNow());
      return { internship, entries };
    },
    15_000,
  );

  if (logbook.error !== undefined && !logbook.data) return <ErrorNote error={explainError(logbook.error)} />;
  if (logbook.data === undefined) return <p className="muted">{t.common.loading}</p>;
  if (logbook.data === null) return <p className="note note-warn">{t.verify.notFound}</p>;

  const { internship, entries } = logbook.data;
  return (
    <div className="stack">
      <div className="logbook-meta">
        <strong>{internship.hostOrg}</strong>
        <span>
          {t.verify.supervisorWallet}: <AddressLink address={internship.supervisor} />
        </span>
        <a href={shareLink(internship.address)}>{t.common.publicPage}</a>
      </div>
      {isSelfRegistered(internship) && <p className="note note-warn">{t.verify.selfRegistered}</p>}
      <TodayCard internship={internship} entries={entries} onChanged={logbook.refresh} />
      {internship.stipendPerPeriod > 0n && (
        <StipendCard internship={internship} entries={entries} onChanged={logbook.refresh} />
      )}
      <HistoryList internship={internship} entries={entries} onChanged={logbook.refresh} />
      <BackdateDemo internship={internship} entries={entries} />
    </div>
  );
}
