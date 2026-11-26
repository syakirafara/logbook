// review_entry: the supervisor approves or rejects a page while its review window is open.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DAY, REVIEW_SECS, START, ParafTest, eventsIn, expectAnchorError, expectOk, statusName } from './paraf.mjs';

/** One internship with a page written at START + 1000. */
async function setup() {
  const t = new ParafTest();
  const internship = await t.registerOk();
  t.chain.setTime(START + 1_000);
  const entry = await t.submitOk({ internship, periodIndex: 0 });
  const deadline = START + 1_000 + REVIEW_SECS; // counted from the moment the page was written
  return { t, internship, entry, deadline };
}

describe('review_entry', () => {
  test('the supervisor approves a page', async () => {
    const { t, internship, entry } = await setup();
    t.chain.setTime(START + 5_000);
    const result = await t.review({ internship, entry, approve: true });
    expectOk(result);

    const page = t.entryAccount(entry);
    assert.equal(statusName(page), 'approved');
    assert.equal(page.reviewedAt.toNumber(), START + 5_000);
    assert.equal(page.reasonCode, 0);
    const counts = t.internshipAccount(internship);
    assert.equal(counts.approvedCount, 1);
    assert.equal(counts.rejectedCount, 0);
    assert.equal(counts.autoApprovedCount, 0);

    const [event] = eventsIn(result);
    assert.equal(event.name, 'EntryReviewed');
    assert.equal(event.data.periodIndex, 0);
    assert.equal(event.data.approved, true);
  });

  test('the supervisor rejects a page with a reason code', async () => {
    const { t, internship, entry } = await setup();
    const result = await t.review({ internship, entry, approve: false, reasonCode: 3 });
    expectOk(result);

    const page = t.entryAccount(entry);
    assert.equal(statusName(page), 'rejected');
    assert.equal(page.reasonCode, 3);
    const counts = t.internshipAccount(internship);
    assert.equal(counts.rejectedCount, 1);
    assert.equal(counts.approvedCount, 0);

    const [event] = eventsIn(result);
    assert.equal(event.data.approved, false);
    assert.equal(event.data.reasonCode, 3);
  });

  test('review is still allowed exactly at the deadline', async () => {
    const { t, internship, entry, deadline } = await setup();
    t.chain.setTime(deadline);
    await t.reviewOk({ internship, entry, approve: true });
    assert.equal(statusName(t.entryAccount(entry)), 'approved');
  });

  test('ReviewWindowClosed: one second after the deadline', async () => {
    const { t, internship, entry, deadline } = await setup();
    t.chain.setTime(deadline + 1);
    expectAnchorError(await t.review({ internship, entry, approve: true }), 'ReviewWindowClosed');
    expectAnchorError(await t.review({ internship, entry, approve: false }), 'ReviewWindowClosed');
    assert.equal(statusName(t.entryAccount(entry)), 'pending');
  });

  test('the window is counted from submission, so the last page can be reviewed after the internship ends', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk({ totalPeriods: 2 });
    t.chain.setTime(START + 2 * DAY - 1); // the last second of the last day
    const entry = await t.submitOk({ internship, periodIndex: 1 });
    t.chain.setTime(START + 2 * DAY - 1 + REVIEW_SECS); // the internship ended 2 days ago
    await t.reviewOk({ internship, entry, approve: true });
  });

  test('NotSupervisor: only the supervisor can review', async () => {
    const { t, internship, entry } = await setup();
    for (const wallet of [t.intern, t.coordinator, t.stranger]) {
      const error = expectAnchorError(await t.review({ internship, entry, approve: true, supervisor: wallet }), 'NotSupervisor');
      assert.equal(error.origin, 'internship');
    }
    assert.equal(statusName(t.entryAccount(entry)), 'pending');
  });

  test('WrongInternship: the supervisor of another internship cannot review this page', async () => {
    const { t, entry } = await setup();
    // The stranger registers an internship where they are the supervisor...
    const own = await t.registerOk({ coordinator: t.stranger, internshipId: 99, supervisor: t.stranger.publicKey });
    // ...and tries to reject the real intern's page through it.
    const result = await t.review({ internship: own, entry, approve: false, supervisor: t.stranger });
    const error = expectAnchorError(result, 'WrongInternship');
    assert.equal(error.origin, 'entry');
    assert.equal(statusName(t.entryAccount(entry)), 'pending');
  });

  test('WrongInternship: a supervisor of two interns must use the matching internship', async () => {
    const t = new ParafTest();
    const secondIntern = t.newWallet();
    const internshipA = await t.registerOk({ internshipId: 1 });
    const internshipB = await t.registerOk({ internshipId: 2, intern: secondIntern.publicKey });
    const pageB = await t.submitOk({ internship: internshipB, periodIndex: 0, intern: secondIntern });

    expectAnchorError(await t.review({ internship: internshipA, entry: pageB, approve: true }), 'WrongInternship');
    await t.reviewOk({ internship: internshipB, entry: pageB, approve: true });
    assert.equal(t.internshipAccount(internshipA).approvedCount, 0);
    assert.equal(t.internshipAccount(internshipB).approvedCount, 1);
  });

  test('NotPending: a page can only be reviewed once', async () => {
    const { t, internship, entry } = await setup();
    await t.reviewOk({ internship, entry, approve: true });
    expectAnchorError(await t.review({ internship, entry, approve: false }), 'NotPending');
    expectAnchorError(await t.review({ internship, entry, approve: true }), 'NotPending');
    assert.equal(statusName(t.entryAccount(entry)), 'approved');
    assert.equal(t.internshipAccount(internship).approvedCount, 1);
  });

  test('NotPending: an auto-approved page cannot be reviewed', async () => {
    const { t, internship, entry, deadline } = await setup();
    t.chain.setTime(deadline + 1);
    await t.finalizeOk({ internship, entry });
    expectAnchorError(await t.review({ internship, entry, approve: false }), 'NotPending');
    assert.equal(statusName(t.entryAccount(entry)), 'autoApproved');
  });
});
