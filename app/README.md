# Paraf web app

The web app for **Paraf**, an internship logbook on Solana.
*A silent supervisor can't stall your internship.*

Vite + React + TypeScript. It talks to the Paraf program on **devnet** with
`@coral-xyz/anchor@0.29.0` and `@solana/web3.js@1.99.0` (pinned on purpose: newer majors do not
work with Anchor 0.29 or the wallet adapter).

## Run it

```bash
cd app
npm install
cp .env.example .env.local   # then put your program ID in VITE_PROGRAM_ID
npm run dev                  # http://localhost:5173
```

| Variable | Required | Meaning |
|---|---|---|
| `VITE_PROGRAM_ID` | yes | Program ID from Solana Playground after deploying. Without it the app shows a setup banner. |
| `VITE_RPC_URL` | no | Devnet RPC URL. Default `https://api.devnet.solana.com`. Keep the word `devnet` in the URL: wallets use it to pick the network. |

Wallet: Phantom (or any Wallet Standard wallet). In Phantom, turn on
**Settings → Developer Settings → Testnet Mode** and choose **Solana Devnet**.
Free devnet SOL: https://faucet.solana.com

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type-check (`tsc -b`) and build into `dist/` (this is what Vercel runs) |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run sync-idl` | Copy `../program/idl/paraf.json` into `src/idl/` after the program changes |
| `npm run lint` | Lint with oxlint |

## Deploy to Vercel

1. Import the GitHub repo in Vercel and set **Root Directory** to `app`.
2. Framework preset: Vite (detected automatically). Build command `npm run build`, output `dist`.
3. Add `VITE_PROGRAM_ID` (and optionally `VITE_RPC_URL`) under **Environment Variables**, then deploy.
   Vite bakes these values in at build time, so redeploy after changing them.

## How the code is organised

```
src/
  strings.ts            every English text in the UI (copy it to add another language)
  config.ts             reads VITE_PROGRAM_ID / VITE_RPC_URL
  idl/paraf.json        the program's IDL (copied by npm run sync-idl)
  lib/
    paraf.ts            program client: PDAs, account types, fetchInternship, fetchEntries, list by intern/supervisor
    instructions.ts     builds the 5 instructions (register, submit, review, finalize, claim)
    schedule.ts         day / review-window maths, mirroring lib.rs
    chainClock.ts       reads the blockchain clock (Clock sysvar)
    tx.ts               simulate -> wallet signs and sends -> wait for confirmation
    errors.ts           turns program and wallet errors into readable messages (uses the IDL)
    hash.ts             salted SHA-256 fingerprint of the private full text, and the saved page file
    limits.ts           limits copied from lib.rs
    bytes.ts, format.ts, explorer.ts, url.ts, download.ts, tabs.ts, symbols.ts   small helpers
  hooks/                useParaf, useChainClock, usePolledData (never faster than every 10 s), useTx, useTxLog
  components/           shared pieces (header, tabs, wallet setup, status chips, calendar, ...)
  views/                one folder per tab: register, intern, supervisor, verify
  styles/               theme.css (colours, light + dark), app.css (layout)
```

### The Solana parts in one minute

- **Accounts and PDAs.** The program stores an `Internship` account per placement and an `Entry`
  account per day. Their addresses are PDAs derived from seeds, exactly as in `lib.rs`:
  `["internship", coordinator, internship_id as u64 little-endian]` and
  `["entry", internship, period_index as u16 little-endian]` (see `lib/paraf.ts`).
- **Chain clock.** "Today" is decided by the blockchain clock, so the app reads the Clock sysvar
  and keeps the offset to the device clock (refreshed every 45 s).
- **Simulate first.** Every transaction is simulated before the wallet is asked to sign. If the
  program would refuse, the app shows the reason from the IDL and nothing is signed.
- **Backdating demo.** "Try to backdate" only simulates (`sigVerify: false`), so judges can see
  the program refuse an old day (`NotCurrentPeriod`) without signing anything.
- **Private full text.** Only a fingerprint goes on-chain: SHA-256 of a fresh 16-byte random salt
  followed by the text. The text is normalised first (CRLF → LF, trimmed). The salt stops anyone
  from finding short texts such as "Sick" by hashing guesses. After submitting, the intern saves a
  `.txt` page file that holds the salt and the text; the Verify tab checks that file against the
  fingerprint.
- **Network use.** The public devnet RPC allows about 100 requests per 10 s per IP, so the app
  refreshes every 15-60 s and pauses while the tab is hidden.

Everything on Solana is public and permanent: keep summaries short and never write confidential details.
