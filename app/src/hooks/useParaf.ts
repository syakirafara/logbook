import { useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { PROGRAM_ID } from '../config';
import { makeProgram } from '../lib/paraf';

/**
 * The RPC connection plus the Anchor client for the Paraf program.
 * Views only render once VITE_PROGRAM_ID is valid (see App.tsx), so PROGRAM_ID is set here.
 */
export function useParaf() {
  const { connection } = useConnection();
  const program = useMemo(() => {
    if (!PROGRAM_ID) throw new Error('VITE_PROGRAM_ID is not configured');
    return makeProgram(connection, PROGRAM_ID);
  }, [connection]);
  return { connection, program };
}
