// Helpers shared by all test files: addresses, one function per instruction, and checks.
import anchor from '@coral-xyz/anchor';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { LocalChain } from './chain.mjs';

const { AnchorError, AnchorProvider, BN, EventParser, LangErrorCode, Program } = anchor;

// Anchor refuses to run if the program's declare_id! differs from the address it is loaded at,
// so the tests use a binary built with this made-up address ("npm run build:program").
// It is Keypair.fromSeed() of the text "paraf local test program" padded with zeros to 32 bytes.
// Nothing is ever deployed there.
export const TEST_PROGRAM_ID = new PublicKey('7T41Lw8GgsWJke86tpVSkMhrVoz6WRLjgiARkH94M11Q');

export const DAY = 86_400; // one logbook day in seconds
export const REVIEW_SECS = 2 * DAY; // the supervisor has 2 days to review a page
export const START = 1_800_000_000; // the chain clock when each test begins (any fixed time works)
export const INTERNSHIP_SIZE = 193; // bytes, 8-byte discriminator included
export const ENTRY_SIZE = 257;
// Start time limits, copied from lib.rs.
export const START_GRACE_SECS = 5 * 60; // a start time may be up to 5 minutes in the past
export const MAX_START_AHEAD_SECS = 366 * DAY; // and at most 366 days in the future

const programFile = new URL('../program/target/paraf-test.so', import.meta.url);
const sourceFile = new URL('../program/src/lib.rs', import.meta.url);
export const idl = JSON.parse(readFileSync(new URL('../program/idl/paraf.json', import.meta.url), 'utf8'));

if (!existsSync(programFile)) {
  throw new Error('program/target/paraf-test.so is missing. Run "npm run build:program" in the tests folder first.');
}
if (statSync(sourceFile).mtimeMs > statSync(programFile).mtimeMs) {
  console.warn('WARNING: lib.rs changed after paraf-test.so was built. Run "npm run build:program" to test the latest code.');
}

// Anchor only uses the provider to build instructions here; nothing is sent to this URL.
// Its wallet is a random key, so a test that forgets a signer fails instead of signing by accident.
const provider = new AnchorProvider(
  new Connection('http://127.0.0.1:8899'),
  { publicKey: Keypair.generate().publicKey, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
  {},
);
export const program = new Program(idl, TEST_PROGRAM_ID, provider);
const eventParser = new EventParser(TEST_PROGRAM_ID, program.coder);

// ---------------------------------------------------------------------------
// Addresses (PDAs). The IDL has no seeds, so clients derive them like this.
// ---------------------------------------------------------------------------

/** ["internship", coordinator, internship_id as u64 little-endian] -> [address, bump] */
export function findInternshipAddress(coordinator, internshipId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('internship'), coordinator.toBuffer(), new BN(String(internshipId)).toArrayLike(Buffer, 'le', 8)],
    TEST_PROGRAM_ID,
  );
}

/** ["entry", internship, period_index as u16 little-endian] -> [address, bump] */
export function findEntryAddress(internship, periodIndex) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('entry'), internship.toBuffer(), new BN(periodIndex).toArrayLike(Buffer, 'le', 2)],
    TEST_PROGRAM_ID,
  );
}

/** SHA-256 of the full private page text, as the 32 numbers the program stores. */
export function sha256(text) {
  return [...createHash('sha256').update(text, 'utf8').digest()];
}

// ---------------------------------------------------------------------------
// One fresh chain per test, with four funded wallets.
// ---------------------------------------------------------------------------

export class ParafTest {
  constructor() {
    this.chain = new LocalChain();
    this.chain.loadProgram(TEST_PROGRAM_ID, programFile);
    this.chain.setTime(START);
    this.coordinator = this.newWallet();
    this.intern = this.newWallet();
    this.supervisor = this.newWallet();
    this.stranger = this.newWallet(); // someone with no role in the internship
  }

  newWallet(sol = 100) {
    const wallet = Keypair.generate();
    this.chain.airdrop(wallet.publicKey, BigInt(sol) * BigInt(LAMPORTS_PER_SOL));
    return wallet;
  }

  // Each action returns the transaction result plus the address it worked on.

  async register({
    coordinator = this.coordinator,
    internshipId = 1,
    intern = this.intern.publicKey,
    supervisor = this.supervisor.publicKey,
    hostOrg = 'Example Host Org',
    startTs = 0, // 0 = start now
    periodSecs = DAY,
    reviewSecs = REVIEW_SECS,
    totalPeriods = 5,
    stipendPerPeriod = 0n, // lamports
    internship = findInternshipAddress(coordinator.publicKey, internshipId)[0],
  } = {}) {
    const ix = await program.methods
      .registerInternship(
        new BN(String(internshipId)),
        intern,
        supervisor,
        hostOrg,
        new BN(String(startTs)),
        periodSecs,
        reviewSecs,
        totalPeriods,
        new BN(String(stipendPerPeriod)),
      )
      .accounts({ internship, coordinator: coordinator.publicKey, systemProgram: SystemProgram.programId })
      .instruction();
    return { ...this.chain.send([ix], [coordinator]), internship };
  }

  async submit({
    internship,
    periodIndex,
    intern = this.intern,
    summary = `Day ${periodIndex}: set up the project and wrote tests`,
    detailHash = sha256(`Full private notes for day ${periodIndex}`),
    entry = findEntryAddress(internship, periodIndex)[0],
  }) {
    const ix = await program.methods
      .submitEntry(periodIndex, summary, detailHash)
      .accounts({ internship, entry, intern: intern.publicKey, systemProgram: SystemProgram.programId })
      .instruction();
    return { ...this.chain.send([ix], [intern]), entry };
  }

  async review({ internship, entry, approve, reasonCode = 0, supervisor = this.supervisor }) {
    const ix = await program.methods
      .reviewEntry(approve, reasonCode)
      .accounts({ internship, entry, supervisor: supervisor.publicKey })
      .instruction();
    return this.chain.send([ix], [supervisor]);
  }

  async finalize({ internship, entry, caller = this.stranger }) {
    // No signer is needed: the caller only pays the transaction fee.
    const ix = await this.finalizeInstruction({ internship, entry });
    return this.chain.send([ix], [caller]);
  }

  finalizeInstruction({ internship, entry }) {
    return program.methods.finalizeEntry().accounts({ internship, entry }).instruction();
  }

  async claim({ internship, intern = this.intern }) {
    const ix = await this.claimInstruction({ internship, intern: intern.publicKey });
    return this.chain.send([ix], [intern]);
  }

  claimInstruction({ internship, intern }) {
    return program.methods.claimStipend().accounts({ internship, intern }).instruction();
  }

  // Shortcuts for steps that must succeed.

  async registerOk(options) {
    const result = await this.register(options);
    expectOk(result);
    return result.internship;
  }

  async submitOk(options) {
    const result = await this.submit(options);
    expectOk(result);
    return result.entry;
  }

  async reviewOk(options) {
    expectOk(await this.review(options));
  }

  async finalizeOk(options) {
    expectOk(await this.finalize(options));
  }

  async claimOk(options) {
    expectOk(await this.claim(options));
  }

  // Read accounts back, decoded with the IDL (u64/i64 fields come back as BN).

  internshipAccount(address) {
    const account = this.chain.getAccount(address);
    return account ? program.coder.accounts.decode('Internship', account.data) : null;
  }

  entryAccount(address) {
    const account = this.chain.getAccount(address);
    return account ? program.coder.accounts.decode('Entry', account.data) : null;
  }
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

export function expectOk(result) {
  if (result.ok) return;
  const hint =
    result.error?.customCode === LangErrorCode.DeclaredProgramIdMismatch
      ? '\nHint: paraf-test.so was built for another program ID. Run "npm run build:program".'
      : '';
  assert.fail(`Transaction failed: ${result.error?.message}${hint}\n${result.logs.join('\n')}`);
}

/** The transaction failed with this Anchor error (a Paraf error from the IDL, or an Anchor one). */
export function expectAnchorError(result, name) {
  const number = idl.errors.find((e) => e.name === name)?.code ?? LangErrorCode[name];
  assert.ok(number !== undefined, `Unknown error name: ${name}`);
  assert.equal(result.ok, false, `Expected ${name}, but the transaction succeeded`);
  const parsed = AnchorError.parse(result.logs);
  assert.ok(parsed, `Expected ${name}, but no Anchor error was logged (${result.error?.message})\n${result.logs.join('\n')}`);
  assert.equal(parsed.error.errorCode.code, name);
  assert.equal(parsed.error.errorCode.number, number);
  // The runtime reports the same number as the instruction's Custom error code.
  assert.equal(result.error.customCode, number);
  return parsed.error;
}

/** The transaction failed inside the System Program (for example "account already in use"). */
export function expectSystemProgramError(result, code, logText) {
  assert.equal(result.ok, false, 'Expected a System Program error, but the transaction succeeded');
  assert.equal(result.error.customCode, code);
  const failed = `Program ${SystemProgram.programId.toBase58()} failed: custom program error: 0x${code.toString(16)}`;
  assert.ok(result.logs.includes(failed), `Expected "${failed}" in the logs\n${result.logs.join('\n')}`);
  assert.ok(result.logs.some((log) => log.includes(logText)), `Expected a log containing "${logText}"\n${result.logs.join('\n')}`);
}

/** Anchor events emitted by the transaction, as [{ name, data }]. */
export function eventsIn(result) {
  return [...eventParser.parseLogs(result.logs)];
}

export function statusName(entry) {
  return Object.keys(entry.status)[0]; // Anchor decodes enums as { approved: {} }
}
