// Copy the program's IDL into the web app.
//
// The IDL is the program's "menu": its instructions, accounts and error messages.
// `node scripts/pg-build.mjs` (in the repo root) saves it to program/idl/paraf.json.
// Run `npm run sync-idl` after every program change so the app and the program agree.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(appRoot, '..', 'program', 'idl', 'paraf.json');
const to = join(appRoot, 'src', 'idl', 'paraf.json');

mkdirSync(dirname(to), { recursive: true });
copyFileSync(from, to);
console.log(`Copied ${from}\n    -> ${to}`);
