import type { PublicKey } from '@solana/web3.js';
import { useState, type FormEvent } from 'react';
import { CalendarGrid } from '../../components/CalendarGrid';
import { ErrorNote } from '../../components/ErrorNote';
import { RoleHeader } from '../../components/RoleHeader';
import { TextField } from '../../components/TextField';
import { useChainClock } from '../../hooks/useChainClock';
import { useParaf } from '../../hooks/useParaf';
import { usePolledData } from '../../hooks/usePolledData';
import { explainError } from '../../lib/errors';
import { parseAddress } from '../../lib/format';
import { fetchEntries, fetchInternship } from '../../lib/paraf';
import { getUrlParam, setUrlParam } from '../../lib/url';
import { t } from '../../strings';
import { DayDetails } from './DayDetails';
import { InternshipSummary } from './InternshipSummary';

/** Public view: anyone can check a logbook from the chain with ?i=<internship address>. No wallet needed. */
export function VerifyView() {
  const { connection, program } = useParaf();
  const { getNow } = useChainClock();
  const [input, setInput] = useState(() => getUrlParam('i') ?? '');
  const [address, setAddress] = useState<PublicKey | null>(() => parseAddress(getUrlParam('i')));
  const [inputError, setInputError] = useState<string | null>(() =>
    getUrlParam('i') && !parseAddress(getUrlParam('i')) ? t.verify.invalid : null,
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const data = usePolledData(
    address ? `verify:${address.toBase58()}` : null,
    async () => {
      if (!address) return null;
      const internship = await fetchInternship(connection, program, address);
      if (!internship) return null;
      const entries = await fetchEntries(connection, program, internship, getNow());
      return { internship, entries };
    },
    20_000,
  );

  const lookUp = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseAddress(input);
    if (!parsed) {
      setInputError(t.verify.invalid);
      return;
    }
    setInputError(null);
    setAddress(parsed);
    setSelectedDay(null);
    setUrlParam('i', parsed.toBase58());
  };

  return (
    <>
      <RoleHeader role="verify" />
      <form className="card" onSubmit={lookUp} noValidate>
        <TextField
          id="lookup"
          label={t.verify.lookupLabel}
          help={t.verify.lookupHelp}
          error={inputError}
          value={input}
          onChange={setInput}
          mono
        >
          <button type="submit" className="btn btn-primary">
            {t.verify.lookupButton}
          </button>
        </TextField>
      </form>

      {address && data.error !== undefined && !data.data && <ErrorNote error={explainError(data.error)} />}
      {address && data.data === undefined && data.loading && <p className="muted">{t.common.loading}</p>}
      {address && data.data === null && <p className="note note-warn">{t.verify.notFound}</p>}

      {data.data && (
        <>
          <InternshipSummary internship={data.data.internship} entries={data.data.entries} />
          <section className="card" aria-labelledby="calendar-title">
            <h3 id="calendar-title">{t.verify.calendarTitle}</h3>
            <p className="help">{t.verify.calendarHelp}</p>
            <CalendarGrid
              internship={data.data.internship}
              entries={data.data.entries}
              selected={selectedDay}
              onSelect={setSelectedDay}
            />
          </section>
          {selectedDay !== null && (
            <DayDetails
              key={selectedDay}
              internship={data.data.internship}
              entry={data.data.entries[selectedDay] ?? null}
              day={selectedDay}
              onChanged={data.refresh}
            />
          )}
        </>
      )}
    </>
  );
}
