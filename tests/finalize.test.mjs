// finalize_entry: once the review window has passed in silence, anyone can finalize the page
// and it counts as approved ("silence = approval").
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  DAY,
  REVIEW_SECS,
  START,
  ParafTest,
  eventsIn,
  expectAnchorError,
  expectOk,
  findEntryAddress,
  statusName,
} from './paraf.mjs';

/** One internship with a page written at START + 1000. */
async function setup() {
  const t = new ParafTest();
  const internship = await t.registerOk();
  t.chain.setTime(START + 1_000);
  const entry = await t.submitOk({ internship, periodIndex: 0 });
  const deadline = START + 1_000 + REVIEW_SECS;
  return { t, internship, entry, deadline };
}

describe('finalize_entry', () => {
  test('ReviewWindowOpen: not while the supervisor can still review, including the deadline itself', async () => {
    const { t, internship, entry, deadline } = await setup();
    expectAnchorError(await t.finalize({ internship, entry }), 'ReviewWindowOpen'); // right after writing
    t.chain.setTime(deadline);
    expectAnchorError(await t.finalize({ internship, entry }), 'ReviewWindowOpen');
    assert.equal(statusName(t.entryAccount(entry)), 'pending');
  });

  test('anyone can finalize one second after the deadline: silence = approval', async () => {
    const { t, internship, entry, deadline } = await setup();
    t.chain.setTime(deadline + 1);
    // The stranger has no role in this internship. They only sign as the fee payer.
    const result = await t.finalize({ internship, entry, caller: t.stranger });
    expectOk(result);

    const page = t.entryAccount(entry);
    assert.equal(statusName(page), 'autoApproved');
    assert.equal(page.reviewedAt.toNumber(), deadline + 1);
    assert.equal(page.reasonCode, 0);
    const counts = t.internshipAccount(internship);
    assert.equal(counts.approvedCount, 1); // auto-approved days count as approved, so they are paid
    assert.equal(counts.autoApprovedCount, 1);
    assert.equal(counts.rejectedCount, 0);

    const [event] = eventsIn(result);
    assert.equal(event.name, 'EntryAutoApproved');
    assert.ok(event.data.internship.equals(internship));
    assert.equal(event.data.periodIndex, 0);
  });

  test('the intern can finalize their own silent page too', async () => {
    const { t, internship, entry, deadline } = await setup();
    t.chain.setTime(deadline + 1);
    await t.finalizeOk({ internship, entry, caller: t.intern });
    assert.equal(statusName(t.entryAccount(entry)), 'autoApproved');
  });

  test('NotPending: reviewed pages cannot be finalized, so a rejection stays a rejection', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk();
    const approved = await t.submitOk({ internship, periodIndex: 0 });
    await t.reviewOk({ internship, entry: approved, approve: true });
    t.chain.setTime(START + DAY);
    const rejected = await t.submitOk({ internship, periodIndex: 1 });
    await t.reviewOk({ internship, entry: rejected, approve: false });

    t.chain.setTime(START + DAY + REVIEW_SECS + 1); // both windows have closed
    expectAnchorError(await t.finalize({ internship, entry: approved }), 'NotPending');
    expectAnchorError(await t.finalize({ internship, entry: rejected }), 'NotPending');
    assert.equal(statusName(t.entryAccount(rejected)), 'rejected');
    assert.equal(t.internshipAccount(internship).approvedCount, 1);
  });

  test('NotPending: a page can only be finalized once', async () => {
    const { t, internship, entry, deadline } = await setup();
    t.chain.setTime(deadline + 1);
    await t.finalizeOk({ internship, entry });
    expectAnchorError(await t.finalize({ internship, entry }), 'NotPending');
    const counts = t.internshipAccount(internship);
    assert.equal(counts.approvedCount, 1);
    assert.equal(counts.autoApprovedCount, 1);
  });

  test('WrongInternship: an internship with a shorter window cannot be used to finalize early', async () => {
    const { t, entry } = await setup(); // the real window is 2 days
    // Someone registers their own internship with a 10-second review window...
    const own = await t.registerOk({ coordinator: t.stranger, internshipId: 99, reviewSecs: 10 });
    t.chain.setTime(START + 1_000 + 11);
    // ...and tries to finalize the real page with it, long before its real deadline.
    const error = expectAnchorError(await t.finalize({ internship: own, entry }), 'WrongInternship');
    assert.equal(error.origin, 'entry');
    assert.equal(statusName(t.entryAccount(entry)), 'pending');
  });

  test('accounts that are not a real Internship are rejected', async () => {
    const { t, entry, deadline } = await setup();
    t.chain.setTime(deadline + 1);
    // A plain wallet is owned by the System Program, not by Paraf.
    expectAnchorError(await t.finalize({ internship: t.stranger.publicKey, entry }), 'AccountOwnedByWrongProgram');
    // A page is owned by Paraf, but its first 8 bytes say "Entry", not "Internship".
    expectAnchorError(await t.finalize({ internship: entry, entry }), 'AccountDiscriminatorMismatch');
    assert.equal(statusName(t.entryAccount(entry)), 'pending');
  });

  test('a day without a page cannot be finalized', async () => {
    const { t, internship, deadline } = await setup();
    t.chain.setTime(deadline + DAY);
    const [missingPage] = findEntryAddress(internship, 1);
    const error = expectAnchorError(await t.finalize({ internship, entry: missingPage }), 'AccountNotInitialized');
    assert.equal(error.origin, 'entry');
  });
});
