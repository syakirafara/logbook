# Paraf

**A silent supervisor can't stall your internship.**

Paraf is an internship logbook on Solana. Interns write one page per day, supervisors sign off ("paraf" is Indonesian for a sign-off initial), and the rules are enforced by a Solana program instead of whoever owns the spreadsheet.

| | |
|---|---|
| Program ID (devnet) | `C5gK2wuixKeNhcjAhLE2jzwNG3NwbD4ca1AQyznmnPH4` · [Explorer](https://explorer.solana.com/address/C5gK2wuixKeNhcjAhLE2jzwNG3NwbD4ca1AQyznmnPH4?cluster=devnet) |
| Live demo | `TBD` (Vercel URL) |
| Demo video | `TBD` (under 3 minutes) |

## The problem

Indonesian university students on internships keep a daily logbook that a field supervisor must sign. The campus turns it into course credits, and paid programmes use it to release stipends. In practice:

- pages get written days later and backdated,
- supervisors sign weeks of pages at once, or not at all,
- when a supervisor simply does nothing, the intern waits, and so does the stipend.

## How it works

The program enforces four rules:

1. **No backdating.** An intern can only write the page for the current day. The day is computed from the chain clock, not the intern's laptop.
2. **Review deadline.** The supervisor approves or rejects a page inside a fixed review window that starts when the page is submitted.
3. **Silence = approval.** If the window closes without a decision, anyone can finalize the page and it becomes *Auto-approved*.
4. **Stipend held by code (optional).** The coordinator locks the whole stipend when registering the internship. The intern can claim it only for approved or auto-approved days.

```
 Coordinator ──register_internship──▶ Internship PDA (rules + locked stipend)
                                          │
 Intern ──────submit_entry (today only)──▶ Entry PDA per day ◀── review_entry ── Supervisor
                                          │                     (inside window)
 Anyone ──────finalize_entry (after window, no decision) ──▶ Auto-approved
 Intern ──────claim_stipend ──▶ lamports for approved days
```

### Accounts

| Account | Seeds | Holds |
|---|---|---|
| `Internship` | `["internship", coordinator, internship_id (u64 LE)]` | intern, supervisor, coordinator, schedule (start, day length, review window, number of days), stipend per day, counters, host organisation. Its lamports above rent are the locked stipend. |
| `Entry` | `["entry", internship, period_index (u16 LE)]` | one logbook page: status, timestamps, reason code, a 160-byte public summary and the SHA-256 fingerprint of the private full text. |

### Instructions

| Instruction | Signer | What it does |
|---|---|---|
| `register_internship` | coordinator | Creates the internship and locks `stipend_per_period × total_periods`. |
| `submit_entry` | intern | Writes today's page. Fails with `NotCurrentPeriod` for any other day; a page can never be overwritten. |
| `review_entry` | supervisor | Approves or rejects while the window is open (`ReviewWindowClosed` afterwards). |
| `finalize_entry` | anyone | Auto-approves a pending page after its window (`ReviewWindowOpen` before). |
| `claim_stipend` | intern | Pays every approved day not yet paid, keeping the account rent-exempt. |

Every instruction emits an event, and every failure returns a named error (16 in total).

## Tech stack

- **Program:** Rust, Anchor 0.29.0, built and deployed with [Solana Playground](https://beta.solpg.io) (`program/src/lib.rs`).
- **Web app:** Vite + React + TypeScript, `@coral-xyz/anchor` 0.29.0, `@solana/web3.js` 1.99.0, `@solana/wallet-adapter-react` 0.15.40 (`app/`).
- **Tests:** 72 tests on the real compiled program in an in-process Solana VM ([QuasarSVM](https://www.npmjs.com/package/@blueshift-gg/quasar-svm)), with clock control for the time windows (`tests/`).

## Run it

### 1. Deploy the program (Solana Playground)

1. Open [beta.solpg.io](https://beta.solpg.io), create the Playground wallet (bottom-left) and fund it with about 3.5 devnet SOL.
2. Create a new **Anchor (Rust)** project and replace `src/lib.rs` with `program/src/lib.rs`.
3. Click **Build**, then **Deploy**, and copy the Program ID.

A fresh deploy creates a new Program ID. Put it in `app/.env.local` and in `declare_id!` in `program/src/lib.rs`.

### 2. Run the web app

```bash
cd app
cp .env.example .env.local   # then set VITE_PROGRAM_ID
npm install
npm run dev
```

Use Phantom (or Solflare / Backpack) with **Testnet Mode → Solana Devnet**. To try every role alone, use two wallet accounts: one as coordinator + intern, one as supervisor.

### 3. Run the tests

```bash
cd tests
npm install
npm test
```

`npm run build:program` rebuilds the test binary through the Playground build server (`scripts/pg-build.mjs`).

## Privacy

Everything on-chain is public forever. Paraf stores only a short public summary per day. The full text stays with the intern; the chain holds `SHA-256(random salt + text)`, so the text can be proven later without being revealed or guessed.

## Known limitations

- **Trust root:** the coordinator names the intern and supervisor wallets, and the supervisor does not sign up front. The app shows who registered each internship ("self-registered" when coordinator = intern).
- **Unused stipend stays locked:** stipend for rejected or unwritten days, and account rent, are not refunded yet (planned: `refund_unused`).
- **Finalize is a transaction:** a silent page stays *Pending* until someone sends `finalize_entry`; the app shows a button for it.
- **Clock edges:** "today" follows the chain clock, which can differ from a laptop by a few seconds; the app disables Submit in the last 15 seconds of a day.
- Stipends use devnet test SOL. In production this would be a rupiah stablecoin or an on-chain approval that triggers the existing bank payout.

## Team

`TBD`

## License

[MIT](LICENSE)
