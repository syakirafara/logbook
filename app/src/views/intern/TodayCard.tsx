import { useWallet } from '@solana/wallet-adapter-react';
import { useState, type FormEvent } from 'react';
import { Countdown } from '../../components/Countdown';
import { Field } from '../../components/Field';
import { Stamp } from '../../components/Stamp';
import { StatusChip } from '../../components/StatusChip';
import { TxStatus } from '../../components/TxStatus';
import { useChainClock } from '../../hooks/useChainClock';
import { useParaf } from '../../hooks/useParaf';
import { useTx } from '../../hooks/useTx';
import { byteLength } from '../../lib/bytes';
import { downloadText } from '../../lib/download';
import { EMPTY_HASH, fingerprint, newSalt, normaliseText, proofFileText, type PageProof } from '../../lib/hash';
import { submitEntryIx } from '../../lib/instructions';
import { MAX_SUMMARY_BYTES, SUBMIT_CUTOFF_SECS } from '../../lib/limits';
import type { Entry, Internship } from '../../lib/paraf';
import { currentPeriod, dayState, periodEnd, phaseOf } from '../../lib/schedule';
import { t } from '../../strings';

interface Props {
  internship: Internship;
  entries: (Entry | null)[];
  onChanged: () => void;
}

/** Today's page: "Day X of N", a countdown from the chain clock, and the form (submit_entry). */
export function TodayCard({ internship, entries, onChanged }: Props) {
  const { now, getNow } = useChainClock();
  const { program } = useParaf();
  const { publicKey } = useWallet();
  const tx = useTx();
  const [summary, setSummary] = useState('');
  const [fullText, setFullText] = useState('');
  // The page file (salt + full text) of the page being sent. Without it the page can never be proven,
  // so it is offered as soon as the transaction has been sent, even if confirming it fails later.
  const [proof, setProof] = useState<PageProof | null>(null);
  const proofToSave = proof && tx.signature ? proof : null;

  const phase = phaseOf(internship, now);
  if (phase !== 'active') {
    return (
      <section className="card today" aria-labelledby="today-title">
        <h3 id="today-title">{phase === 'notStarted' ? t.intern.notStartedTitle : t.intern.endedTitle}</h3>
        {phase === 'notStarted' ? (
          <p className="today-clock">
            {t.intern.startsIn} <Countdown to={internship.startTs} />
          </p>
        ) : (
          <p>{t.intern.endedText}</p>
        )}
        <TxStatus tx={tx} />
        {proofToSave && <SaveCopy proof={proofToSave} />}
      </section>
    );
  }

  const day = currentPeriod(internship, now); // counted from 0
  const endsAt = periodEnd(internship, day);
  const todaysEntry = entries[day] ?? null;
  const trimmed = summary.trim();
  const bytes = byteLength(trimmed);
  const tooLate = endsAt - now <= SUBMIT_CUTOFF_SECS;
  const canSubmit =
    publicKey !== null && !todaysEntry && bytes > 0 && bytes <= MAX_SUMMARY_BYTES && !tooLate && !tx.busy;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!publicKey || !canSubmit) return;
    // Read the chain clock again right now: the program decides "today" with the same clock.
    const periodIndex = currentPeriod(internship, getNow());
    const text = normaliseText(fullText);
    // Every page gets a new random salt (see lib/hash.ts). Without a full text there is no file to keep.
    const pageProof = text
      ? { internship: internship.address.toBase58(), day: periodIndex + 1, salt: newSalt(), text }
      : null;
    setProof(pageProof);
    const signature = await tx.run(t.intern.txSubmit(periodIndex + 1), async () => {
      // The fingerprint is computed here in the browser; the full text never leaves this device.
      const detailHash = pageProof ? await fingerprint(pageProof.salt, pageProof.text) : EMPTY_HASH;
      return [
        await submitEntryIx(program, {
          internship: internship.address,
          intern: publicKey,
          periodIndex,
          summary: trimmed,
          detailHash,
        }),
      ];
    });
    if (signature) {
      setSummary('');
      setFullText('');
      onChanged();
    }
  };

  return (
    <section className="card today" aria-labelledby="today-title">
      <div className="today-head">
        <h3 id="today-title">{t.common.dayOf(day + 1, internship.totalPeriods)}</h3>
        <p className="today-clock">
          {todaysEntry ? t.intern.nextDayIn : t.intern.timeLeft} <Countdown to={endsAt} />
        </p>
      </div>
      <p className="help">{t.intern.chainClockNote}</p>

      {todaysEntry ? (
        <div className="written has-stamp">
          <p>
            <strong>{t.intern.writtenTitle}</strong> <StatusChip state={dayState(internship, todaysEntry, day, now)} />
          </p>
          <blockquote className="summary">{todaysEntry.summary}</blockquote>
          {(todaysEntry.status === 'approved' || todaysEntry.status === 'autoApproved') && (
            <div className="card-stamp">
              <Stamp kind={todaysEntry.status} />
            </div>
          )}
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <Field id="summary" label={t.intern.summaryLabel} help={t.intern.summaryHelp}>
            <textarea
              id="summary"
              rows={3}
              value={summary}
              placeholder={t.intern.summaryPlaceholder}
              onChange={(event) => setSummary(event.target.value)}
              aria-invalid={bytes > MAX_SUMMARY_BYTES}
              aria-describedby="summary-count summary-help"
            />
            <p id="summary-count" className={bytes > MAX_SUMMARY_BYTES ? 'counter is-over' : 'counter'}>
              {t.intern.bytes(bytes, MAX_SUMMARY_BYTES)}
            </p>
          </Field>
          <Field id="fullText" label={t.intern.fullTextLabel} help={t.intern.fullTextHelp}>
            <textarea
              id="fullText"
              rows={5}
              value={fullText}
              onChange={(event) => setFullText(event.target.value)}
              aria-describedby="fullText-help"
            />
          </Field>
          {tooLate && <p className="note note-warn">{t.intern.tooLate(SUBMIT_CUTOFF_SECS)}</p>}
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {t.intern.submit}
            </button>
          </div>
          <p className="help">{t.intern.rentNote}</p>
        </form>
      )}

      <TxStatus tx={tx} />
      {proofToSave && <SaveCopy proof={proofToSave} />}
    </section>
  );
}

/** Reminds the intern to keep the page file (salt + full text), with a button to save it as a .txt file. */
function SaveCopy({ proof }: { proof: PageProof }) {
  return (
    <div className="note">
      <strong>{t.intern.saveCopyTitle}</strong>
      <p>{t.intern.saveCopyText}</p>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={() => downloadText(`paraf-day-${proof.day}.txt`, proofFileText(proof))}
      >
        {t.intern.saveCopy}
      </button>
    </div>
  );
}
