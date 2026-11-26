// Compile program/src/lib.rs on the Solana Playground build server (the same server
// the beta.solpg.io website uses), then save the IDL and the compiled program.
//
// Usage: node scripts/pg-build.mjs [--program-id <base58>] [--out <path>]
//
//   --program-id <base58>  Build with this program ID in declare_id!(...). Only the code
//                          sent to the server changes; lib.rs on disk stays the same.
//                          The saved IDL (program/idl/paraf.json) is not touched.
//                          Needs --out, so the real program/target/paraf.so is never replaced.
//   --out <path>           Where to save the compiled program
//                          (default: program/target/paraf.so).
//
// The local tests use both flags to make a test binary (see "build:program" in tests/package.json).
// The server keeps one binary per build id, so test builds use their own id (program/.pg-uuid-test).
// That way a test build never downloads a normal build's binary, or the other way round.
//
// This only checks that the program compiles with Playground's toolchain (Anchor 0.29).
// Deploying is still done from the Playground website (Build -> Deploy).
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.solpg.io';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libPath = join(root, 'program', 'src', 'lib.rs');
const idlPath = join(root, 'program', 'idl', 'paraf.json');

// Optional flags.
const args = process.argv.slice(2);
let programId = null;
let outPath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--program-id' && args[i + 1]) programId = args[++i];
  else if (args[i] === '--out' && args[i + 1]) outPath = args[++i];
  else {
    console.error(`Unknown or incomplete option: ${args[i]}`);
    console.error('Usage: node scripts/pg-build.mjs [--program-id <base58>] [--out <path>]');
    process.exit(1);
  }
}
// A program ID is 32 to 44 base58 characters (base58 has no 0, O, I or l).
if (programId && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(programId)) {
  console.error(`Not a valid program ID: ${programId}`);
  process.exit(1);
}
if (programId && !outPath) {
  console.error('--program-id needs --out too, so the real program/target/paraf.so is not replaced.');
  process.exit(1);
}
// --out is relative to the folder you run the command from.
const soPath = outPath ? resolve(outPath) : join(root, 'program', 'target', 'paraf.so');
// Normal builds and test builds each keep their own build id on the server.
const uuidPath = join(root, 'program', programId ? '.pg-uuid-test' : '.pg-uuid');

let code = await readFile(libPath, 'utf8');
if (programId) {
  const declareId = /declare_id!\s*\(\s*"[^"]*"\s*\)/g;
  const found = code.match(declareId) ?? [];
  if (found.length !== 1) {
    console.error(`Expected exactly one declare_id!("...") in lib.rs, found ${found.length}.`);
    process.exit(1);
  }
  code = code.replace(declareId, `declare_id!("${programId}")`);
  console.log(`Building with program ID ${programId} (lib.rs on disk is not changed).`);
}
const savedUuid = existsSync(uuidPath) ? (await readFile(uuidPath, 'utf8')).trim() : null;

async function build(uuid) {
  const res = await fetch(`${API}/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: [['/src/lib.rs', code]],
      uuid,
      flags: { seedsFeature: false, noDocs: true, safetyChecks: false },
    }),
  });
  return res;
}

let res = await build(savedUuid);
// A saved build id can expire on the server; retry once with a fresh one.
if (!res.ok && savedUuid) res = await build(null);
if (!res.ok) {
  console.error(`Build server error: HTTP ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const out = await res.json();
if (out.uuid) await writeFile(uuidPath, out.uuid);
const uuid = out.uuid ?? savedUuid;

console.log(out.stderr.trim());
if (!out.idl) {
  console.error('\nBUILD FAILED (see the errors above).');
  process.exit(1);
}

if (programId) {
  // The IDL is the same for every program ID, so the saved one stays as it is.
  console.log(`\nBuild OK. IDL not saved (--program-id build), ${idlPath} is unchanged.`);
} else {
  await mkdir(dirname(idlPath), { recursive: true });
  await writeFile(idlPath, JSON.stringify(out.idl, null, 2) + '\n');
  console.log(`\nBuild OK. IDL saved to ${idlPath}`);
}

const bin = await fetch(`${API}/deploy/${uuid}`);
if (bin.ok) {
  await mkdir(dirname(soPath), { recursive: true });
  await writeFile(soPath, Buffer.from(await bin.arrayBuffer()));
  console.log(`Compiled program saved to ${soPath}`);
} else {
  console.warn(`Could not download the compiled program (HTTP ${bin.status}).`);
}
