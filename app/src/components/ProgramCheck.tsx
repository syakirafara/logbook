import { useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { PROGRAM_ID } from '../config';
import { t } from '../strings';

/** Checks once that VITE_PROGRAM_ID really is a program on devnet, and warns if it is not. */
export function ProgramCheck() {
  const { connection } = useConnection();
  const [problem, setProblem] = useState<'programMissing' | 'notProgram' | null>(null);

  useEffect(() => {
    if (!PROGRAM_ID) return;
    let cancelled = false;
    connection
      .getAccountInfo(PROGRAM_ID)
      .then((info) => {
        if (cancelled) return;
        // Programs live in accounts too; theirs are marked "executable".
        if (!info) setProblem('programMissing');
        else if (!info.executable) setProblem('notProgram');
      })
      .catch(() => {
        // Network trouble: other parts of the app will show their own errors.
      });
    return () => {
      cancelled = true;
    };
  }, [connection]);

  if (!problem) return null;
  return (
    <p className="note note-warn" role="alert">
      {t.setup[problem]}
    </p>
  );
}
