// The Paraf client: how the app finds and reads the program's accounts.
//
// Solana basics used here:
// - A program keeps its data in "accounts". Paraf has two kinds: Internship (one per placement)
//   and Entry (one logbook page per day).
// - Paraf's account addresses are PDAs (Program Derived Addresses). A PDA is computed from some
//   "seeds" plus the program ID, so anyone can work out where a page lives without a database.
// - Account data is raw bytes: an 8-byte "discriminator" (a type tag Anchor adds) and then each
//   field in order. The IDL tells Anchor's coder how to turn those bytes back into objects.
import { Program, type Idl } from '@coral-xyz/anchor';
import { PublicKey, type AccountInfo, type Connection } from '@solana/web3.js';
import type { Buffer } from 'buffer';
import idlJson from '../idl/paraf.json';
import { u16LE, u64LE, utf8 } from './bytes';
import { startedDays } from './schedule';

/** The IDL ("interface description"): the program's instructions, account layouts and errors. */
export const IDL = idlJson as Idl;

/**
 * Anchor client for the program. We use it to build instructions and decode accounts.
 * Reading needs no wallet, so the "provider" is just the connection; the wallet signs later (see tx.ts).
 */
export function makeProgram(connection: Connection, programId: PublicKey): Program {
  return new Program(IDL, programId, { connection });
}

// ---------------------------------------------------------------------------
// Addresses (PDAs). The seeds must match lib.rs exactly, byte for byte.
// ---------------------------------------------------------------------------

/** Internship address. lib.rs seeds: [b"internship", coordinator, internship_id.to_le_bytes()] */
export function internshipPda(programId: PublicKey, coordinator: PublicKey, internshipId: bigint): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [utf8('internship'), coordinator.toBytes(), u64LE(internshipId)],
    programId,
  );
  return address;
}

/** Page (Entry) address. lib.rs seeds: [b"entry", internship, period_index.to_le_bytes()] (u16) */
export function entryPda(programId: PublicKey, internship: PublicKey, periodIndex: number): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [utf8('entry'), internship.toBytes(), u16LE(periodIndex)],
    programId,
  );
  return address;
}

// ---------------------------------------------------------------------------
// Account types, as the app uses them.
// ---------------------------------------------------------------------------

export type EntryStatus = 'pending' | 'approved' | 'rejected' | 'autoApproved';

/** One internship placement (the Internship account). */
export interface Internship {
  address: PublicKey;
  intern: PublicKey;
  supervisor: PublicKey;
  coordinator: PublicKey;
  internshipId: bigint;
  /** Unix time (seconds) when day 0 starts. */
  startTs: number;
  /** Length of one day, in seconds. */
  periodSecs: number;
  /** How long the supervisor has to review, counted from submission, in seconds. */
  reviewSecs: number;
  totalPeriods: number;
  /** Stipend per approved day, in lamports (1 SOL = 1,000,000,000 lamports). */
  stipendPerPeriod: bigint;
  submittedCount: number;
  /** Approved by the supervisor or by silence. These days are payable. */
  approvedCount: number;
  autoApprovedCount: number;
  rejectedCount: number;
  paidCount: number;
  hostOrg: string;
}

/** One logbook page (the Entry account). */
export interface Entry {
  address: PublicKey;
  internship: PublicKey;
  /** Day number counted from 0. The app shows periodIndex + 1 ("Day 1"). */
  periodIndex: number;
  status: EntryStatus;
  reasonCode: number;
  submittedAt: number;
  reviewedAt: number;
  /** SHA-256 of (random salt + private full text), or 32 zero bytes when there is none (see hash.ts). */
  detailHash: Uint8Array;
  summary: string;
}

// What Anchor's coder returns. u64/i64 fields arrive as BN ("big number") objects, so we
// convert them with toString(); an enum arrives as an object such as { pending: {} }.
type BigNumber = { toString(): string };

interface RawInternship {
  intern: PublicKey;
  supervisor: PublicKey;
  coordinator: PublicKey;
  internshipId: BigNumber;
  startTs: BigNumber;
  periodSecs: number;
  reviewSecs: number;
  totalPeriods: number;
  stipendPerPeriod: BigNumber;
  submittedCount: number;
  approvedCount: number;
  autoApprovedCount: number;
  rejectedCount: number;
  paidCount: number;
  hostOrg: string;
}

interface RawEntry {
  internship: PublicKey;
  periodIndex: number;
  status: Record<string, unknown>;
  reasonCode: number;
  submittedAt: BigNumber;
  reviewedAt: BigNumber;
  detailHash: number[];
  summary: string;
}

function toInternship(address: PublicKey, raw: RawInternship): Internship {
  return {
    address,
    intern: raw.intern,
    supervisor: raw.supervisor,
    coordinator: raw.coordinator,
    internshipId: BigInt(raw.internshipId.toString()),
    startTs: Number(raw.startTs.toString()),
    periodSecs: raw.periodSecs,
    reviewSecs: raw.reviewSecs,
    totalPeriods: raw.totalPeriods,
    stipendPerPeriod: BigInt(raw.stipendPerPeriod.toString()),
    submittedCount: raw.submittedCount,
    approvedCount: raw.approvedCount,
    autoApprovedCount: raw.autoApprovedCount,
    rejectedCount: raw.rejectedCount,
    paidCount: raw.paidCount,
    hostOrg: raw.hostOrg,
  };
}

function toEntry(address: PublicKey, raw: RawEntry): Entry {
  return {
    address,
    internship: raw.internship,
    periodIndex: raw.periodIndex,
    status: Object.keys(raw.status)[0] as EntryStatus,
    reasonCode: raw.reasonCode,
    submittedAt: Number(raw.submittedAt.toString()),
    reviewedAt: Number(raw.reviewedAt.toString()),
    detailHash: Uint8Array.from(raw.detailHash),
    summary: raw.summary,
  };
}

/** True when the intern registered the internship with their own wallet (nobody vouched for it). */
export function isSelfRegistered(internship: Internship): boolean {
  return internship.coordinator.equals(internship.intern);
}

// ---------------------------------------------------------------------------
// Reading accounts
// ---------------------------------------------------------------------------

/** Reads one internship. Returns null if there is no Paraf internship at that address. */
export async function fetchInternship(
  connection: Connection,
  program: Program,
  address: PublicKey,
): Promise<Internship | null> {
  const info = await connection.getAccountInfo(address);
  // Only trust accounts owned by our program: nobody else can write to them.
  if (!info || !info.owner.equals(program.programId)) return null;
  try {
    // decode() also checks the discriminator, so a page address is rejected here.
    return toInternship(address, program.coder.accounts.decode<RawInternship>('Internship', info.data));
  } catch {
    return null;
  }
}

/** Reads the pages of one internship, from day 0 up to today. A day without a page gives null. */
export async function fetchEntries(
  connection: Connection,
  program: Program,
  internship: Internship,
  now: number,
): Promise<(Entry | null)[]> {
  const [pages] = await fetchEntriesOfMany(connection, program, [internship], now);
  return pages;
}

/** Like fetchEntries, for several internships at once (fewer requests to the RPC server). */
export async function fetchEntriesOfMany(
  connection: Connection,
  program: Program,
  internships: Internship[],
  now: number,
): Promise<(Entry | null)[][]> {
  // 1. Work out the address of every page that could exist by now (one per day that has started).
  const addressLists = internships.map((internship) =>
    Array.from({ length: startedDays(internship, now) }, (_, day) =>
      entryPda(program.programId, internship.address, day),
    ),
  );
  // 2. Read all of them, 100 per request.
  const infos = await getAccountsInBatches(connection, addressLists.flat());
  // 3. Decode, and split the results back into one list per internship.
  let position = 0;
  return addressLists.map((addresses) =>
    addresses.map((address) => {
      const info = infos[position++];
      if (!info || !info.owner.equals(program.programId)) return null;
      return toEntry(address, program.coder.accounts.decode<RawEntry>('Entry', info.data));
    }),
  );
}

/** getMultipleAccountsInfo accepts at most 100 addresses per request, so longer lists are split. */
async function getAccountsInBatches(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(AccountInfo<Buffer> | null)[]> {
  const results: (AccountInfo<Buffer> | null)[] = [];
  for (let i = 0; i < addresses.length; i += 100) {
    results.push(...(await connection.getMultipleAccountsInfo(addresses.slice(i, i + 100))));
  }
  return results;
}

/** Every internship whose intern is this wallet. The intern field starts at byte 8 (right after the discriminator). */
export function listInternshipsByIntern(program: Program, intern: PublicKey): Promise<Internship[]> {
  return listInternshipsWhere(program, 8, intern);
}

/** Every internship whose supervisor is this wallet. That field starts at byte 40 (8 + 32 bytes of intern). */
export function listInternshipsBySupervisor(program: Program, supervisor: PublicKey): Promise<Internship[]> {
  return listInternshipsWhere(program, 40, supervisor);
}

async function listInternshipsWhere(program: Program, offset: number, wallet: PublicKey): Promise<Internship[]> {
  // getProgramAccounts with a "memcmp" filter: the RPC server only returns Internship accounts whose
  // bytes at `offset` equal this wallet address. Anchor adds the discriminator filter for us.
  const rows = await program.account.internship.all([{ memcmp: { offset, bytes: wallet.toBase58() } }]);
  return rows.map((row) => toInternship(row.publicKey, row.account as unknown as RawInternship));
}
