// submit_entry: the intern writes the page for the current day, and only that day.
import { SystemProgram } from '@solana/web3.js';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  DAY,
  ENTRY_SIZE,
  START,
  TEST_PROGRAM_ID,
  ParafTest,
  eventsIn,
  expectAnchorError,
  expectOk,
  expectSystemProgramError,
  findEntryAddress,
  sha256,
  statusName,
} from './paraf.mjs';

/** A 5-day internship whose day 0 starts at START. */
async function setup(options) {
  const t = new ParafTest();
  const internship = await t.registerOk(options);
  return { t, internship };
}

describe('submit_entry', () => {
  test("writes today's page", async () => {
    const { t, internship } = await setup();
    t.chain.setTime(START + 3600); // one hour into day 0
    const internBefore = t.chain.getBalance(t.intern.publicKey);
    const detailHash = sha256('Full private notes for day 0');
    const result = await t.submit({ internship, periodIndex: 0, summary: 'Set up the dev environment', detailHash });
    expectOk(result);

    const [address, bump] = findEntryAddress(internship, 0);
    assert.ok(result.entry.equals(address));
    const entry = t.entryAccount(address);
    assert.ok(entry.internship.equals(internship));
    assert.equal(entry.periodIndex, 0);
    assert.equal(statusName(entry), 'pending');
    assert.equal(entry.reasonCode, 0);
    assert.equal(entry.submittedAt.toNumber(), START + 3600);
    assert.equal(entry.reviewedAt.toNumber(), 0);
    assert.deepEqual(entry.detailHash, detailHash);
    assert.equal(entry.bump, bump);
    assert.equal(entry.summary, 'Set up the dev environment');
    assert.equal(t.internshipAccount(internship).submittedCount, 1);

    // The page belongs to the program, and the intern paid its rent.
    const account = t.chain.getAccount(address);
    assert.ok(account.owner.equals(TEST_PROGRAM_ID));
    assert.equal(account.data.length, ENTRY_SIZE);
    assert.equal(account.lamports, t.chain.rentExemptMinimum(ENTRY_SIZE));
    assert.equal(internBefore - t.chain.getBalance(t.intern.publicKey), account.lamports);

    const [event] = eventsIn(result);
    assert.equal(event.name, 'EntrySubmitted');
    assert.ok(event.data.internship.equals(internship));
    assert.equal(event.data.periodIndex, 0);
    assert.equal(event.data.submittedAt.toNumber(), START + 3600);
  });

  test('the last second of a day still belongs to that day', async () => {
    const { t, internship } = await setup();
    t.chain.setTime(START + DAY - 1);
    await t.submitOk({ internship, periodIndex: 0 });
  });

  test('exactly at the day boundary the next day starts', async () => {
    const { t, internship } = await setup();
    t.chain.setTime(START + DAY);
    expectAnchorError(await t.submit({ internship, periodIndex: 0 }), 'NotCurrentPeriod');
    await t.submitOk({ internship, periodIndex: 1 });
  });

  test("NotCurrentPeriod: yesterday's page cannot be written (no backdating)", async () => {
    const { t, internship } = await setup();
    t.chain.setTime(START + 2 * DAY + 600); // day 2
    const result = await t.submit({ internship, periodIndex: 1 });
    expectAnchorError(result, 'NotCurrentPeriod');
    assert.equal(t.chain.getAccount(result.entry), null);
    assert.equal(t.internshipAccount(internship).submittedCount, 0);
  });

  test("NotCurrentPeriod: tomorrow's page cannot be written in advance", async () => {
    const { t, internship } = await setup();
    t.chain.setTime(START + 600); // day 0
    const result = await t.submit({ internship, periodIndex: 1 });
    expectAnchorError(result, 'NotCurrentPeriod');
    assert.equal(t.chain.getAccount(result.entry), null);
  });

  test('NotStarted: nothing can be written before the start time', async () => {
    const { t, internship } = await setup({ startTs: START + 2 * DAY });
    t.chain.setTime(START + 2 * DAY - 1);
    expectAnchorError(await t.submit({ internship, periodIndex: 0 }), 'NotStarted');
    t.chain.setTime(START + 2 * DAY); // the very first second of day 0
    await t.submitOk({ internship, periodIndex: 0 });
  });

  test('the last day can be written until its last second', async () => {
    const { t, internship } = await setup({ totalPeriods: 3 });
    t.chain.setTime(START + 3 * DAY - 1);
    await t.submitOk({ internship, periodIndex: 2 });
  });

  test('InternshipEnded: nothing can be written after the last day', async () => {
    const { t, internship } = await setup({ totalPeriods: 3 });
    t.chain.setTime(START + 3 * DAY);
    expectAnchorError(await t.submit({ internship, periodIndex: 3 }), 'InternshipEnded');
    expectAnchorError(await t.submit({ internship, periodIndex: 2 }), 'InternshipEnded');
  });

  test('InvalidSummary: the summary cannot be empty', async () => {
    const { t, internship } = await setup();
    expectAnchorError(await t.submit({ internship, periodIndex: 0, summary: '' }), 'InvalidSummary');
  });

  test('InvalidSummary: at most 160 bytes of plain text', async () => {
    const { t, internship } = await setup();
    expectAnchorError(await t.submit({ internship, periodIndex: 0, summary: 'a'.repeat(161) }), 'InvalidSummary');
    await t.submitOk({ internship, periodIndex: 0, summary: 'a'.repeat(160) });
  });

  test('InvalidSummary: the limit counts bytes, not characters', async () => {
    const { t, internship } = await setup();
    // "é" is 2 bytes in UTF-8: 81 of them are only 81 characters but 162 bytes.
    expectAnchorError(await t.submit({ internship, periodIndex: 0, summary: 'é'.repeat(81) }), 'InvalidSummary');
    // An emoji is 4 bytes: 41 of them are 164 bytes.
    expectAnchorError(await t.submit({ internship, periodIndex: 0, summary: '🙂'.repeat(41) }), 'InvalidSummary');
    const entry = await t.submitOk({ internship, periodIndex: 0, summary: 'é'.repeat(80) }); // exactly 160 bytes
    assert.equal(t.entryAccount(entry).summary, 'é'.repeat(80));
  });

  test('NotIntern: only the intern can write pages', async () => {
    const { t, internship } = await setup();
    for (const wallet of [t.stranger, t.supervisor, t.coordinator]) {
      const before = t.chain.getBalance(wallet.publicKey);
      const result = await t.submit({ internship, periodIndex: 0, intern: wallet });
      const error = expectAnchorError(result, 'NotIntern');
      assert.equal(error.origin, 'internship');
      assert.equal(t.chain.getAccount(result.entry), null);
      assert.equal(t.chain.getBalance(wallet.publicKey), before);
    }
  });

  test('a page cannot be written twice', async () => {
    const { t, internship } = await setup();
    t.chain.setTime(START + 100);
    const entry = await t.submitOk({ internship, periodIndex: 0, summary: 'First version' });
    t.chain.setTime(START + 200);
    // The page address is already taken, so the System Program refuses to create it again.
    const result = await t.submit({ internship, periodIndex: 0, summary: 'Second version' });
    expectSystemProgramError(result, 0, 'already in use');

    const page = t.entryAccount(entry);
    assert.equal(page.summary, 'First version');
    assert.equal(page.submittedAt.toNumber(), START + 100);
    assert.equal(t.internshipAccount(internship).submittedCount, 1);
  });

  test('SOL sent to a page address beforehand does not block the intern', async () => {
    const { t, internship } = await setup();
    const [entry] = findEntryAddress(internship, 0);
    const gift = t.chain.rentExemptMinimum(0);
    const transfer = SystemProgram.transfer({ fromPubkey: t.stranger.publicKey, toPubkey: entry, lamports: gift });
    expectOk(t.chain.send([transfer], [t.stranger]));

    const internBefore = t.chain.getBalance(t.intern.publicKey);
    await t.submitOk({ internship, periodIndex: 0 });
    assert.equal(statusName(t.entryAccount(entry)), 'pending');
    // Anchor only tops the account up to the rent minimum.
    assert.equal(t.chain.getBalance(entry), t.chain.rentExemptMinimum(ENTRY_SIZE));
    assert.equal(internBefore - t.chain.getBalance(t.intern.publicKey), t.chain.rentExemptMinimum(ENTRY_SIZE) - gift);
  });

  test('the page address must be the PDA of [internship, period_index]', async () => {
    const { t, internship } = await setup();
    const [wrongAddress] = findEntryAddress(internship, 1);
    const error = expectAnchorError(await t.submit({ internship, periodIndex: 0, entry: wrongAddress }), 'ConstraintSeeds');
    assert.equal(error.origin, 'entry');
  });
});
