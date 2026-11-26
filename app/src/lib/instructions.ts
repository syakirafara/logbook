// Building the program's instructions.
//
// An instruction = which program to call + which accounts it reads or writes + the arguments as bytes.
// A transaction carries one or more instructions plus signatures (sending happens in tx.ts).
// Anchor's `program.methods.<name>(...args).accounts({...}).instruction()` encodes the bytes for us
// using the IDL. We pass every account ourselves, because Playground's IDL has no PDA seeds.
import { BN, type Program } from '@coral-xyz/anchor';
import { SystemProgram, type PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { entryPda, internshipPda } from './paraf';

export interface RegisterInternshipArgs {
  coordinator: PublicKey;
  internshipId: bigint;
  intern: PublicKey;
  supervisor: PublicKey;
  hostOrg: string;
  /** Unix seconds, or 0 for "start now" (the program then uses the chain clock). */
  startTs: number;
  periodSecs: number;
  reviewSecs: number;
  totalPeriods: number;
  /** Lamports per approved day (0 = no stipend). */
  stipendPerPeriod: bigint;
}

/** register_internship: creates the Internship account and locks the stipend. The coordinator signs and pays. */
export function registerInternshipIx(program: Program, args: RegisterInternshipArgs): Promise<TransactionInstruction> {
  return program.methods
    .registerInternship(
      new BN(args.internshipId.toString()), // u64: big numbers are passed as BN
      args.intern, // publicKey
      args.supervisor, // publicKey
      args.hostOrg, // string
      new BN(args.startTs), // i64
      args.periodSecs, // u32
      args.reviewSecs, // u32
      args.totalPeriods, // u16
      new BN(args.stipendPerPeriod.toString()), // u64
    )
    .accounts({
      internship: internshipPda(program.programId, args.coordinator, args.internshipId),
      coordinator: args.coordinator,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export interface SubmitEntryArgs {
  internship: PublicKey;
  intern: PublicKey;
  /** The day to write, counted from 0. The program only accepts today. */
  periodIndex: number;
  summary: string;
  detailHash: Uint8Array;
}

/** submit_entry: writes the page for one day. The intern signs and pays the page's rent deposit. */
export function submitEntryIx(program: Program, args: SubmitEntryArgs): Promise<TransactionInstruction> {
  return program.methods
    .submitEntry(args.periodIndex, args.summary, Array.from(args.detailHash))
    .accounts({
      internship: args.internship,
      entry: entryPda(program.programId, args.internship, args.periodIndex),
      intern: args.intern,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export interface ReviewEntryArgs {
  internship: PublicKey;
  entry: PublicKey;
  supervisor: PublicKey;
  approve: boolean;
  /** 0 none, 1 absent, 2 incomplete, 3 other (see `reasons` in strings.ts). */
  reasonCode: number;
}

/** review_entry: approve or reject inside the review window. The supervisor signs. */
export function reviewEntryIx(program: Program, args: ReviewEntryArgs): Promise<TransactionInstruction> {
  return program.methods
    .reviewEntry(args.approve, args.reasonCode)
    .accounts({ internship: args.internship, entry: args.entry, supervisor: args.supervisor })
    .instruction();
}

/**
 * finalize_entry: once the review window has closed without a decision, anyone can mark the page
 * AutoApproved ("silence = approval"). No account in it needs to sign; whoever pays the fee signs the transaction.
 */
export function finalizeEntryIx(
  program: Program,
  args: { internship: PublicKey; entry: PublicKey },
): Promise<TransactionInstruction> {
  return program.methods
    .finalizeEntry()
    .accounts({ internship: args.internship, entry: args.entry })
    .instruction();
}

/** claim_stipend: pays the intern for every approved day that has not been paid yet. The intern signs. */
export function claimStipendIx(
  program: Program,
  args: { internship: PublicKey; intern: PublicKey },
): Promise<TransactionInstruction> {
  return program.methods
    .claimStipend()
    .accounts({ internship: args.internship, intern: args.intern })
    .instruction();
}
