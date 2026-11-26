// Settings that come from environment variables (.env.local on your laptop, or the Vercel dashboard).
// Vite only gives the browser variables whose names start with VITE_.
import { PublicKey } from '@solana/web3.js';

/** The Solana RPC server the app reads from. Defaults to the free public devnet server. */
export const RPC_URL: string = import.meta.env.VITE_RPC_URL?.trim() || 'https://api.devnet.solana.com';

/** Why VITE_PROGRAM_ID cannot be used: not set, not an address, or still the placeholder from lib.rs. */
export type ProgramIdProblem = 'missing' | 'invalid' | 'placeholder';

function readProgramId(): { programId: PublicKey | null; problem: ProgramIdProblem | null } {
  const raw = import.meta.env.VITE_PROGRAM_ID?.trim();
  if (!raw) return { programId: null, problem: 'missing' };
  let programId: PublicKey;
  try {
    programId = new PublicKey(raw);
  } catch {
    return { programId: null, problem: 'invalid' };
  }
  // 1111...1111 is the placeholder in declare_id!() before Solana Playground replaces it.
  if (programId.equals(PublicKey.default)) return { programId: null, problem: 'placeholder' };
  return { programId, problem: null };
}

const programIdSetting = readProgramId();

/** The address of the deployed Paraf program, or null when it is not configured. */
export const PROGRAM_ID: PublicKey | null = programIdSetting.programId;
export const PROGRAM_ID_PROBLEM: ProgramIdProblem | null = programIdSetting.problem;
