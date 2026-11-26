// A tiny local Solana chain for the tests.
//
// It runs the real compiled program (program/target/paraf-test.so) inside QuasarSVM, a Solana
// virtual machine that runs inside Node.js: no validator, no network, no Rust needed.
// (litesvm and solana-bankrun, the usual choices, do not ship a Windows build. QuasarSVM does.)
//
// How it works:
// - Every account lives in a JavaScript Map in this file.
// - For each transaction we give the VM the accounts that transaction uses, the VM runs the
//   program, and we save the accounts it returns only if the whole transaction succeeded.
// - The clock is ours to set, so the tests can jump to any second instantly.
// - The VM charges no transaction fees, so balances only change by what the program moves.
import ffi from '@blueshift-gg/quasar-svm/ffi';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { readFileSync } from 'node:fs';

// Playground deploys programs with the upgradeable BPF loader (loader v3), so we do the same.
const UPGRADEABLE_LOADER = 3;
// Rent: an account must hold at least (data length + 128) x this many lamports to stay alive.
// Solana's normal price is 6,960 lamports per byte (3,480 per byte-year, held for 2 years).
const DEFAULT_RENT_PER_BYTE = 6960n;
// A real compute limit: 200,000 units per instruction unless a transaction asks for more.
const COMPUTE_UNITS_PER_INSTRUCTION = 200_000n;
// web3.js needs a blockhash to sign a transaction. The local VM does not check it.
const FAKE_BLOCKHASH = PublicKey.default.toBase58();
const NO_ACCOUNT = { owner: SystemProgram.programId, lamports: 0n, data: Buffer.alloc(0), executable: false };

// Free the VM's native memory when a LocalChain is garbage collected.
const cleanup = new FinalizationRegistry((vm) => ffi.quasar_svm_free(vm));

export class LocalChain {
  #vm = ffi.quasar_svm_new();
  #accounts = new Map(); // base58 address -> { owner, lamports, data, executable }
  #programs = new Set([SystemProgram.programId.toBase58()]); // the VM provides these itself
  #rentPerByte = DEFAULT_RENT_PER_BYTE;
  #time = 0;

  constructor() {
    cleanup.register(this, this.#vm);
  }

  /** Load a compiled program (.so file) at the given address. */
  loadProgram(programId, soFile) {
    const elf = readFileSync(soFile);
    this.#check(ffi.quasar_svm_add_program(this.#vm, programId.toBuffer(), elf, elf.length, UPGRADEABLE_LOADER));
    this.#programs.add(programId.toBase58());
  }

  /** The chain clock (unix seconds). The program reads it with Clock::get(). */
  get time() {
    return this.#time;
  }

  setTime(unixSeconds) {
    this.#time = unixSeconds;
    // Arguments: slot, epoch start time, epoch, leader schedule epoch, unix time.
    this.#check(ffi.quasar_svm_set_clock(this.#vm, 1n, 0n, 0n, 0n, BigInt(unixSeconds)));
  }

  /** Change the rent price per byte. Only used to simulate a network-wide rent increase. */
  setRentPerByte(lamports) {
    // QuasarSVM's set_rent takes the price per byte of a rent-exempt account (default 6,960),
    // even though its C header calls the value lamports_per_byte_year.
    this.#rentPerByte = BigInt(lamports);
    this.#check(ffi.quasar_svm_set_rent(this.#vm, this.#rentPerByte));
  }

  /** Smallest balance that keeps an account of this size alive (what Rent::minimum_balance returns). */
  rentExemptMinimum(dataLength) {
    return (BigInt(dataLength) + 128n) * this.#rentPerByte;
  }

  /** Give a wallet free SOL, like a devnet faucet. */
  airdrop(address, lamports) {
    const account = this.getAccount(address) ?? NO_ACCOUNT;
    this.#accounts.set(address.toBase58(), { ...account, lamports: account.lamports + BigInt(lamports) });
  }

  /** The account at this address, or null if nothing is stored there. */
  getAccount(address) {
    return this.#accounts.get(address.toBase58()) ?? null;
  }

  getBalance(address) {
    return this.getAccount(address)?.lamports ?? 0n;
  }

  /**
   * Sign and run one transaction. signers[0] pays the (free) fee.
   * Returns { ok, error, logs, computeUnits }. A failed transaction changes nothing.
   */
  send(instructions, signers) {
    // 1. Build and sign a normal transaction, exactly like a wallet would.
    const tx = new Transaction({ feePayer: signers[0].publicKey, blockhash: FAKE_BLOCKHASH, lastValidBlockHeight: 0 });
    tx.add(...instructions);
    tx.sign(...signers);
    // serialize() throws if a required signature is missing or the transaction is over 1232 bytes.
    tx.serialize();

    // 2. Like the real runtime, take each account's signer/writable flags from the whole message.
    const message = tx.compileMessage();
    const flags = (pubkey) => {
      const i = message.accountKeys.findIndex((key) => key.equals(pubkey));
      return { isSigner: message.isAccountSigner(i), isWritable: message.isAccountWritable(i) };
    };
    const vmInstructions = instructions.map((ix) => ({
      programId: ix.programId,
      data: ix.data,
      keys: ix.keys.map(({ pubkey }) => ({ pubkey, ...flags(pubkey) })),
    }));

    // 3. Hand the VM every account the transaction uses (programs excluded, the VM has those).
    //    The VM also remembers accounts from earlier calls, but what we pass replaces that,
    //    so this file's Map stays the only source of truth.
    const used = new Map();
    for (const ix of instructions) {
      for (const { pubkey } of ix.keys) {
        if (!this.#programs.has(pubkey.toBase58())) used.set(pubkey.toBase58(), pubkey);
      }
    }
    const accounts = [...used.values()].map((pubkey) => [pubkey, this.getAccount(pubkey) ?? NO_ACCOUNT]);

    // 4. Run it.
    this.#check(ffi.quasar_svm_set_compute_budget(this.#vm, COMPUTE_UNITS_PER_INSTRUCTION * BigInt(instructions.length)));
    const result = this.#execute(encodeInstructions(vmInstructions), encodeAccounts(accounts));

    // 5. Save the new account states, but only if everything succeeded.
    if (result.ok) {
      for (const account of result.accounts) {
        const key = account.address.toBase58();
        if (account.lamports === 0n) this.#accounts.delete(key); // empty accounts disappear on Solana
        else this.#accounts.set(key, { owner: account.owner, lamports: account.lamports, data: account.data, executable: account.executable });
      }
    }
    return { ok: result.ok, error: result.error, logs: result.logs, computeUnits: result.computeUnits };
  }

  #execute(instructionBytes, accountBytes) {
    const resultPointer = [null];
    const resultLength = [0n];
    const code = ffi.quasar_svm_process_transaction(
      this.#vm, instructionBytes, instructionBytes.length, accountBytes, accountBytes.length, resultPointer, resultLength,
    );
    if (code !== 0) throw new Error(`QuasarSVM could not run the transaction (${code}): ${ffi.quasar_last_error()}`);
    const length = Number(resultLength[0]);
    const bytes = Buffer.from(ffi.koffi.decode(resultPointer[0], 'uint8_t', length));
    ffi.quasar_result_free(resultPointer[0], length);
    return decodeResult(bytes);
  }

  #check(code) {
    if (code !== 0) throw new Error(`QuasarSVM error (${code}): ${ffi.quasar_last_error()}`);
  }
}

// ---------------------------------------------------------------------------
// QuasarSVM's byte format (little-endian numbers).
// ---------------------------------------------------------------------------

const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const u64 = (n) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
};
const flag = (yes) => Buffer.from([yes ? 1 : 0]);

// count, then per instruction: program id, data length, data, key count, keys (address, signer, writable)
function encodeInstructions(instructions) {
  const parts = [u32(instructions.length)];
  for (const ix of instructions) {
    parts.push(ix.programId.toBuffer(), u32(ix.data.length), ix.data, u32(ix.keys.length));
    for (const key of ix.keys) parts.push(key.pubkey.toBuffer(), flag(key.isSigner), flag(key.isWritable));
  }
  return Buffer.concat(parts);
}

// count, then per account: address, owner, lamports, data length, data, executable
function encodeAccounts(accounts) {
  const parts = [u32(accounts.length)];
  for (const [address, a] of accounts) {
    parts.push(address.toBuffer(), a.owner.toBuffer(), u64(a.lamports), u32(a.data.length), a.data, flag(a.executable));
  }
  return Buffer.concat(parts);
}

// status, compute units, run time, return data, accounts, logs, error message (the rest is not needed)
function decodeResult(bytes) {
  let at = 0;
  const take = (n) => bytes.subarray(at, (at += n));
  const readU32 = () => take(4).readUInt32LE();
  const readU64 = () => take(8).readBigUInt64LE();

  const status = take(4).readInt32LE();
  const computeUnits = Number(readU64());
  readU64(); // run time in microseconds
  take(readU32()); // return data
  const accounts = [];
  for (let n = readU32(); n > 0; n--) {
    accounts.push({
      address: new PublicKey(take(32)),
      owner: new PublicKey(take(32)),
      lamports: readU64(),
      data: Buffer.from(take(readU32())),
      executable: take(1)[0] !== 0,
    });
  }
  const logs = [];
  for (let n = readU32(); n > 0; n--) logs.push(take(readU32()).toString('utf8'));
  const errorLength = readU32();
  const message = errorLength > 0 ? take(errorLength).toString('utf8') : null;

  // Note: a program error "Custom(0)" also comes back with status 0, so check the message too.
  const ok = status === 0 && message === null;
  const custom = /^Custom\((\d+)\)$/.exec(message ?? '');
  const error = ok ? null : { message, customCode: custom ? Number(custom[1]) : null };
  return { ok, error, accounts, logs, computeUnits };
}
