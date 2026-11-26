// End-to-end check against the REAL program on devnet (not the local simulator).
//
// Usage (from the tests folder):  npm run smoke:devnet
//
// It registers one short demo internship (4 "days" of 30 seconds, 15-second review window,
// 0.001 SOL stipend per day) and walks through every rule:
//   day 1: the intern writes, the supervisor stays silent, anyone finalizes -> auto-approved
//   day 2: the intern writes, the supervisor approves
//   day 3: the intern skips the day
//   day 4: writing day 3 afterwards is refused (no backdating); the intern writes, the supervisor rejects
//   then:  the intern claims the stipend for the 2 approved days; a second claim gets nothing
// Some wrong actions are only simulated (writing ahead, a stranger reviewing, finalizing too early):
// they must fail, and a simulation costs nothing.
//
// The coordinator wallet is tests/devnet-keypair.json (created on the first run, ignored by git).
// It needs about 0.05 SOL. The intern and supervisor are fresh wallets each run; their leftover SOL
// is sent back to the coordinator at the end. Takes about 2 minutes.
import anchor from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const { AnchorError, AnchorProvider, BN, Program } = anchor;

const RPC = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID ?? readProgramIdFromEnvFile());
const KEYPAIR_FILE = new URL('./devnet-keypair.json', import.meta.url);

const PERIOD_SECS = 30;
const REVIEW_SECS = 15;
const TOTAL_PERIODS = 4;
const STIPEND = 1_000_000n; // lamports per approved day (0.001 SOL)
const NEEDED = 0.05 * LAMPORTS_PER_SOL;

const connection = new Connection(RPC, 'confirmed');
const idl = JSON.parse(readFileSync(new URL('../program/idl/paraf.json', import.meta.url), 'utf8'));
const readOnlyWallet = {
  publicKey: Keypair.generate().publicKey,
  signTransaction: async (tx) => tx,
  signAllTransactions: async (txs) => txs,
};
const program = new Program(idl, PROGRAM_ID, new AnchorProvider(connection, readOnlyWallet, {}));

let failures = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sol = (lamports) => (Number(lamports) / LAMPORTS_PER_SOL).toFixed(4) + ' SOL';
const txLink = (sig) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

function readProgramIdFromEnvFile() {
  const file = new URL('../app/.env.local', import.meta.url);
  if (!existsSync(file)) throw new Error('Set PROGRAM_ID, or put VITE_PROGRAM_ID in app/.env.local');
  const match = readFileSync(file, 'utf8').match(/^VITE_PROGRAM_ID=(\S+)/m);
  if (!match) throw new Error('VITE_PROGRAM_ID is empty in app/.env.local');
  return match[1];
}

function loadCoordinator() {
  if (existsSync(KEYPAIR_FILE)) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(KEYPAIR_FILE, 'utf8'))));
  }
  const wallet = Keypair.generate();
  writeFileSync(KEYPAIR_FILE, JSON.stringify([...wallet.secretKey]));
  console.log('Created a new coordinator wallet: tests/devnet-keypair.json');
  return wallet;
}

/** The chain clock (what the program sees), not this computer's clock. */
async function chainNow() {
  const info = await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY, 'confirmed');
  return Number(info.data.readBigInt64LE(32));
}

async function waitForChainTime(target, why) {
  process.stdout.write(`   … waiting for the chain clock (${why})`);
  for (;;) {
    const now = await chainNow();
    if (now >= target) break;
    await sleep(Math.min(target - now, 3) * 1000);
    process.stdout.write('.');
  }
  process.stdout.write('\n');
}

async function send(label, ixs, signers) {
  const tx = new Transaction().add(...ixs);
  try {
    const sig = await sendAndConfirmTransaction(connection, tx, signers, { commitment: 'confirmed' });
    console.log(`✔ ${label}\n   ${txLink(sig)}`);
    return sig;
  } catch (err) {
    failures++;
    console.log(`✘ ${label}\n   ${err.message}`);
    const logs = err.logs ?? (await err.getLogs?.(connection).catch(() => null));
    if (logs) console.log('   ' + logs.join('\n   '));
    throw err;
  }
}

/**
 * Simulates a transaction that must fail with this Anchor error. Nothing is sent.
 * The simulator picks a fresh blockhash, so a repeat of a transaction that was just sent
 * (for example a second claim) reaches the program instead of failing as "AlreadyProcessed".
 */
async function expectRefused(label, ix, signers, errorName) {
  const message = new TransactionMessage({
    payerKey: signers[0].publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [ix],
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  tx.sign(signers);
  const { value } = await connection.simulateTransaction(tx, { replaceRecentBlockhash: true, sigVerify: false });
  const got = value.err ? AnchorError.parse(value.logs ?? [])?.error.errorCode.code : 'it succeeded';
  if (got === errorName) {
    console.log(`✔ ${label} → refused (${errorName})`);
  } else {
    failures++;
    console.log(`✘ ${label} → expected ${errorName}, got ${got ?? JSON.stringify(value.err)}`);
    if (value.logs) console.log('   ' + value.logs.join('\n   '));
  }
}

function check(label, actual, expected) {
  if (actual === expected) {
    console.log(`✔ ${label}: ${actual}`);
  } else {
    failures++;
    console.log(`✘ ${label}: expected ${expected}, got ${actual}`);
  }
}

const internshipPda = (coordinator, id) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('internship'), coordinator.toBuffer(), new BN(String(id)).toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID,
  )[0];
const entryPda = (internship, day) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('entry'), internship.toBuffer(), new BN(day).toArrayLike(Buffer, 'le', 2)],
    PROGRAM_ID,
  )[0];

/** Salted fingerprint, the same way the app does it: SHA-256(16-byte salt + text). */
const fingerprint = (text) => [...createHash('sha256').update(Buffer.concat([randomBytes(16), Buffer.from(text)])).digest()];

const submitIx = (internship, intern, day, summary) =>
  program.methods
    .submitEntry(day, summary, fingerprint(`Catatan lengkap hari ${day + 1}`))
    .accounts({ internship, entry: entryPda(internship, day), intern: intern.publicKey, systemProgram: SystemProgram.programId })
    .instruction();
const reviewIx = (internship, day, supervisor, approve, reasonCode = 0) =>
  program.methods
    .reviewEntry(approve, reasonCode)
    .accounts({ internship, entry: entryPda(internship, day), supervisor: supervisor.publicKey })
    .instruction();
const finalizeIx = (internship, day) =>
  program.methods.finalizeEntry().accounts({ internship, entry: entryPda(internship, day) }).instruction();
const claimIx = (internship, intern) =>
  program.methods.claimStipend().accounts({ internship, intern: intern.publicKey }).instruction();

const readInternship = async (address) =>
  program.coder.accounts.decode('Internship', (await connection.getAccountInfo(address, 'confirmed')).data);
const readEntryStatus = async (internship, day) =>
  Object.keys(program.coder.accounts.decode('Entry', (await connection.getAccountInfo(entryPda(internship, day), 'confirmed')).data).status)[0];

// ---------------------------------------------------------------------------

async function main() {
  console.log(`Paraf devnet check\nProgram: ${PROGRAM_ID.toBase58()}\nRPC:     ${RPC}\n`);

  const programAccount = await connection.getAccountInfo(PROGRAM_ID);
  if (!programAccount?.executable) throw new Error('No program is deployed at this address on devnet.');

  const coordinator = loadCoordinator();
  let balance = await connection.getBalance(coordinator.publicKey);
  console.log(`Coordinator wallet: ${coordinator.publicKey.toBase58()} (${sol(balance)})`);
  if (balance < NEEDED) {
    console.log('   Asking the devnet faucet for 1 SOL...');
    try {
      const sig = await connection.requestAirdrop(coordinator.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, 'confirmed');
      balance = await connection.getBalance(coordinator.publicKey);
      console.log(`   Got it: ${sol(balance)}`);
    } catch (err) {
      console.log(`\nThe faucet refused (${err.message.split('\n')[0]}).`);
      console.log(`Send about 0.1 devnet SOL from Phantom to:\n   ${coordinator.publicKey.toBase58()}\nthen run this again.`);
      process.exit(2);
    }
  }

  const intern = Keypair.generate();
  const supervisor = Keypair.generate();
  console.log(`Intern wallet:      ${intern.publicKey.toBase58()} (new)`);
  console.log(`Supervisor wallet:  ${supervisor.publicKey.toBase58()} (new)\n`);

  await send(
    'Coordinator gives the intern and supervisor some SOL for fees and page deposits',
    [
      SystemProgram.transfer({ fromPubkey: coordinator.publicKey, toPubkey: intern.publicKey, lamports: 0.012 * LAMPORTS_PER_SOL }),
      SystemProgram.transfer({ fromPubkey: coordinator.publicKey, toPubkey: supervisor.publicKey, lamports: 0.002 * LAMPORTS_PER_SOL }),
    ],
    [coordinator],
  );

  // --- Register ---------------------------------------------------------------
  const internshipId = BigInt(Date.now());
  const internship = internshipPda(coordinator.publicKey, internshipId);
  const registerIx = await program.methods
    .registerInternship(
      new BN(String(internshipId)),
      intern.publicKey,
      supervisor.publicKey,
      'Tes devnet otomatis',
      new BN(0), // start now
      PERIOD_SECS,
      REVIEW_SECS,
      TOTAL_PERIODS,
      new BN(String(STIPEND)),
    )
    .accounts({ internship, coordinator: coordinator.publicKey, systemProgram: SystemProgram.programId })
    .instruction();
  await send(`Register the internship (${TOTAL_PERIODS} days, ${sol(STIPEND)} stipend per day locked up front)`, [registerIx], [coordinator]);
  const start = (await readInternship(internship)).startTs.toNumber();
  const dayStart = (day) => start + day * PERIOD_SECS;
  console.log(`   Internship: ${internship.toBase58()}\n`);

  // --- Day 1 (period 0): silence = approval --------------------------------------
  console.log('Day 1: the supervisor stays silent');
  await expectRefused('Intern writes day 2 in advance', await submitIx(internship, intern, 1, 'Terlalu cepat'), [intern], 'NotCurrentPeriod');
  await send('Intern writes day 1', [await submitIx(internship, intern, 0, 'Hari 1: orientasi dan pengenalan tim')], [intern]);
  await expectRefused('Anyone finalizes day 1 while the window is still open', await finalizeIx(internship, 0), [coordinator], 'ReviewWindowOpen');
  const submitted0 = program.coder.accounts.decode('Entry', (await connection.getAccountInfo(entryPda(internship, 0), 'confirmed')).data).submittedAt.toNumber();
  await waitForChainTime(submitted0 + REVIEW_SECS + 2, 'review window of day 1 closes');
  await send('Anyone finalizes day 1 after the window closed (coordinator pays the fee)', [await finalizeIx(internship, 0)], [coordinator]);
  check('Day 1 status', await readEntryStatus(internship, 0), 'autoApproved');

  // --- Day 2 (period 1): the supervisor approves -----------------------------------
  await waitForChainTime(dayStart(1) + 1, 'day 2 starts');
  console.log('Day 2: the supervisor approves');
  await send('Intern writes day 2', [await submitIx(internship, intern, 1, 'Hari 2: membantu input data pajak daerah')], [intern]);
  await expectRefused('A stranger tries to approve day 2', await reviewIx(internship, 1, coordinator, true), [coordinator], 'NotSupervisor');
  await send('Supervisor approves day 2 (paraf)', [await reviewIx(internship, 1, supervisor, true)], [supervisor]);
  check('Day 2 status', await readEntryStatus(internship, 1), 'approved');

  // --- Day 3 (period 2): skipped; Day 4 (period 3): rejected -----------------------
  console.log('Day 3: the intern writes nothing');
  await waitForChainTime(dayStart(3) + 1, 'day 4 starts');
  console.log('Day 4: the supervisor rejects');
  await expectRefused('Intern writes the missed day 3 afterwards (backdating)', await submitIx(internship, intern, 2, 'Telat nulis'), [intern], 'NotCurrentPeriod');
  await send('Intern writes day 4', [await submitIx(internship, intern, 3, 'Hari 4: rekap laporan')], [intern]);
  await send('Supervisor rejects day 4 (reason: incomplete)', [await reviewIx(internship, 3, supervisor, false, 2)], [supervisor]);
  check('Day 4 status', await readEntryStatus(internship, 3), 'rejected');

  // --- Stipend -----------------------------------------------------------------------
  console.log('Stipend');
  const before = await connection.getBalance(intern.publicKey, 'confirmed');
  await send('Intern claims the stipend', [await claimIx(internship, intern)], [intern]);
  const after = await connection.getBalance(intern.publicKey, 'confirmed');
  check('Intern received (minus the 0.000005 SOL fee)', sol(after - before + 5000), sol(2n * STIPEND));
  await expectRefused('Intern claims a second time', await claimIx(internship, intern), [intern], 'NothingToClaim');

  const final = await readInternship(internship);
  check('Pages written', final.submittedCount, 3);
  check('Approved (incl. auto)', final.approvedCount, 2);
  check('Auto-approved', final.autoApprovedCount, 1);
  check('Rejected', final.rejectedCount, 1);
  check('Days paid', final.paidCount, 2);

  // --- Tidy up: send the helpers' leftover SOL back to the coordinator -------------------
  for (const [name, wallet] of [['intern', intern], ['supervisor', supervisor]]) {
    const left = await connection.getBalance(wallet.publicKey, 'confirmed');
    if (left > 5000) {
      await sendAndConfirmTransaction(
        connection,
        new Transaction().add(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: coordinator.publicKey, lamports: left - 5000 })),
        [wallet],
        { commitment: 'confirmed' },
      ).catch((err) => console.log(`   (could not return the ${name}'s leftover SOL: ${err.message})`));
    }
  }

  console.log(`\nInternship on the explorer:\n   https://explorer.solana.com/address/${internship.toBase58()}?cluster=devnet`);
  console.log(`Open it in the app's Verify tab (add this after the app's address, e.g. http://localhost:5173):\n   /?i=${internship.toBase58()}&tab=verify`);
  console.log(`Coordinator balance now: ${sol(await connection.getBalance(coordinator.publicKey))}`);
}

try {
  await main();
} catch (err) {
  if (!failures) console.log(`\n✘ ${err.message}`);
  failures++;
}
console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll devnet checks passed.');
process.exit(failures ? 1 : 0);
