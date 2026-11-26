import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { ErrorNote } from '../../components/ErrorNote';
import { useChainClock } from '../../hooks/useChainClock';
import { useParaf } from '../../hooks/useParaf';
import { explainError, TxError, type FriendlyError } from '../../lib/errors';
import { EMPTY_HASH } from '../../lib/hash';
import { submitEntryIx } from '../../lib/instructions';
import type { Entry, Internship } from '../../lib/paraf';
import { currentPeriod, phaseOf } from '../../lib/schedule';
import { simulateInstructions } from '../../lib/tx';
import { t } from '../../strings';

interface Props {
  internship: Internship;
  entries: (Entry | null)[];
}

type DemoState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; refusal: FriendlyError | null; keyLogs: string[] };

/**
 * Demo for judges: try to write a page for another day. It only SIMULATES the transaction
 * (sigVerify: false), so the wallet is never asked to sign and nothing is sent. The program
 * answers with NotCurrentPeriod ("You can only write the page for today").
 */
export function BackdateDemo({ internship, entries }: Props) {
  const { now } = useChainClock();
  const { connection, program } = useParaf();
  const { publicKey } = useWallet();
  const [state, setState] = useState<DemoState>({ phase: 'idle' });

  if (!publicKey || phaseOf(internship, now) !== 'active') return null;

  // Pick the newest earlier day WITHOUT a page. (For a day that already has a page, the program would
  // fail for another reason first: that page account already exists.)
  const today = currentPeriod(internship, now);
  let target: number | null = null;
  for (let day = today - 1; day >= 0; day--) {
    if (!entries[day]) {
      target = day;
      break;
    }
  }
  const isBackdate = target !== null;
  // On day 1, or when every earlier day has a page, try tomorrow instead. It is refused the same way.
  if (target === null && today + 1 < internship.totalPeriods) target = today + 1;

  const tryIt = async (periodIndex: number) => {
    setState({ phase: 'running' });
    try {
      const instruction = await submitEntryIx(program, {
        internship: internship.address,
        intern: publicKey,
        periodIndex,
        summary: 'Backdated page (demo)',
        detailHash: EMPTY_HASH,
      });
      const simulation = await simulateInstructions(connection, publicKey, [instruction]);
      const refusal = simulation.ok
        ? null
        : explainError(new TxError('Simulation failed', { logs: simulation.logs, txError: simulation.err }));
      // The lines where the program explains its refusal.
      const keyLogs = simulation.logs.filter((line) => line.includes('AnchorError') || line.includes('failed:'));
      setState({ phase: 'done', refusal, keyLogs });
    } catch (error) {
      setState({ phase: 'done', refusal: explainError(error), keyLogs: [] });
    }
  };

  return (
    <section className="card demo" aria-labelledby="demo-title">
      <h3 id="demo-title">{t.intern.backdateTitle}</h3>
      <p>{t.intern.backdateText}</p>
      {target === null ? (
        <p className="muted">{t.intern.backdateNone}</p>
      ) : (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => tryIt(target)}
          disabled={state.phase === 'running'}
        >
          {isBackdate ? t.intern.backdateButton(target + 1) : t.intern.futureButton(target + 1)}
        </button>
      )}

      <div aria-live="polite">
        {state.phase === 'running' && <p className="muted">{t.intern.backdateRunning}</p>}
        {state.phase === 'done' && state.refusal?.name && (
          <div className="note note-blocked">
            <strong>
              {t.intern.backdateBlocked}: {state.refusal.title}
            </strong>
            {state.refusal.detail && <p>{state.refusal.detail}</p>}
            {state.keyLogs.length > 0 && <pre className="logs">{state.keyLogs.join('\n')}</pre>}
          </div>
        )}
        {state.phase === 'done' && state.refusal && !state.refusal.name && <ErrorNote error={state.refusal} />}
        {state.phase === 'done' && !state.refusal && <p className="note note-warn">{t.intern.backdateAllowed}</p>}
      </div>
    </section>
  );
}
