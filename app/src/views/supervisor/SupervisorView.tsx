import { useWallet } from '@solana/wallet-adapter-react';
import { AddressLink } from '../../components/AddressLink';
import { ConnectPrompt } from '../../components/ConnectPrompt';
import { ErrorNote } from '../../components/ErrorNote';
import { FinalizeButton } from '../../components/FinalizeButton';
import { ConnectedAs } from '../../components/ConnectedAs';
import { RoleHeader } from '../../components/RoleHeader';
import { useChainClock } from '../../hooks/useChainClock';
import { useParaf } from '../../hooks/useParaf';
import { usePolledData } from '../../hooks/usePolledData';
import { explainError } from '../../lib/errors';
import { fetchEntriesOfMany, listInternshipsBySupervisor, type Entry, type Internship } from '../../lib/paraf';
import { canFinalize, canReview, currentPeriod, phaseOf, reviewDeadline } from '../../lib/schedule';
import { shareLink } from '../../lib/url';
import { t } from '../../strings';
import { ReviewCard } from './ReviewCard';

interface Page {
  internship: Internship;
  entry: Entry;
}

/** Supervisor view: every pending page across all internships where this wallet is the supervisor. */
export function SupervisorView() {
  const { publicKey } = useWallet();
  const { connection, program } = useParaf();
  const { now, getNow } = useChainClock();

  // Every 15 s: one request for the internship list, then one per 100 pages.
  const data = usePolledData(
    publicKey ? `supervisor:${publicKey.toBase58()}` : null,
    async () => {
      if (!publicKey) return { internships: [], entries: [] };
      const internships = await listInternshipsBySupervisor(program, publicKey);
      const entries = await fetchEntriesOfMany(connection, program, internships, getNow());
      return { internships, entries };
    },
    15_000,
  );

  if (!publicKey) {
    return (
      <>
        <RoleHeader role="supervisor" />
        <ConnectPrompt text={t.wallet.connectSupervisor} />
      </>
    );
  }

  const internships = data.data?.internships ?? [];
  // One flat list of every written page, each with its internship.
  const pages: Page[] = internships.flatMap((internship, i) =>
    (data.data?.entries[i] ?? []).flatMap((entry) => (entry ? [{ internship, entry }] : [])),
  );
  // Still reviewable, most urgent first.
  const queue = pages
    .filter((page) => canReview(page.internship, page.entry, now))
    .sort((a, b) => reviewDeadline(a.internship, a.entry) - reviewDeadline(b.internship, b.entry));
  // The window closed without a decision: anyone can finalize these.
  const silent = pages.filter((page) => canFinalize(page.internship, page.entry, now));

  return (
    <>
      <RoleHeader role="supervisor" />
      <ConnectedAs />
      {data.error !== undefined && <ErrorNote error={explainError(data.error)} />}
      {!data.data && data.loading && <p className="muted">{t.common.loading}</p>}
      {data.data && internships.length === 0 && (
        <div className="card empty">
          <h3>{t.supervisor.noneTitle}</h3>
          <p>{t.supervisor.noneText}</p>
          <p className="help">{t.wallet.switchHint}</p>
        </div>
      )}

      {internships.length > 0 && (
        <>
          <section className="stack" aria-labelledby="queue-title">
            <h3 id="queue-title" className="section-title">
              {t.supervisor.queueTitle} <span className="count">{queue.length}</span>
            </h3>
            {queue.length === 0 && <p className="card muted">{t.supervisor.queueEmpty}</p>}
            {queue.map((page) => (
              <ReviewCard
                key={page.entry.address.toBase58()}
                internship={page.internship}
                entry={page.entry}
                onDone={data.refresh}
              />
            ))}
          </section>

          {silent.length > 0 && (
            <section className="stack" aria-labelledby="silent-title">
              <h3 id="silent-title" className="section-title">
                {t.supervisor.silentTitle} <span className="count">{silent.length}</span>
              </h3>
              <p className="help">{t.supervisor.silentText}</p>
              {silent.map((page) => (
                <article key={page.entry.address.toBase58()} className="card">
                  <div className="review-head">
                    <strong>{t.common.day(page.entry.periodIndex + 1)}</strong>
                    <span>{page.internship.hostOrg}</span>
                    <span className="muted">
                      {t.supervisor.internLabel}: <AddressLink address={page.internship.intern} />
                    </span>
                  </div>
                  <blockquote className="summary">{page.entry.summary}</blockquote>
                  <FinalizeButton internship={page.internship} entry={page.entry} onDone={data.refresh} />
                </article>
              ))}
            </section>
          )}

          <section className="card" aria-labelledby="interns-title">
            <h3 id="interns-title">{t.supervisor.internshipsTitle}</h3>
            <ul className="intern-list">
              {internships.map((internship) => (
                <li key={internship.address.toBase58()}>
                  <strong>{internship.hostOrg}</strong>
                  <span>
                    {t.supervisor.internLabel}: <AddressLink address={internship.intern} />
                  </span>
                  <span className="muted">{progressText(internship, now)}</span>
                  <a href={shareLink(internship.address)}>{t.common.publicPage}</a>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

function progressText(internship: Internship, now: number): string {
  const phase = phaseOf(internship, now);
  if (phase === 'notStarted') return t.verify.notStarted;
  if (phase === 'ended') return t.verify.finished;
  return t.common.dayOf(currentPeriod(internship, now) + 1, internship.totalPeriods);
}
