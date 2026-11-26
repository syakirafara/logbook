// claim_stipend: the intern collects the stipend for approved (and auto-approved) days.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  DAY,
  ENTRY_SIZE,
  INTERNSHIP_SIZE,
  REVIEW_SECS,
  START,
  ParafTest,
  eventsIn,
  expectAnchorError,
  expectOk,
} from './paraf.mjs';

const STIPEND = 1_000_000n; // lamports per approved day

/** A 5-day internship with a stipend, starting at START. */
async function setup(options) {
  const t = new ParafTest();
  const internship = await t.registerOk({ totalPeriods: 5, stipendPerPeriod: STIPEND, ...options });
  return { t, internship };
}

/** Jump to one minute into `day` and write that day's page. */
async function writeDay(t, internship, day) {
  t.chain.setTime(START + day * DAY + 60);
  return t.submitOk({ internship, periodIndex: day });
}

describe('claim_stipend', () => {
  test('pays the intern for an approved day', async () => {
    const { t, internship } = await setup();
    const entry = await writeDay(t, internship, 0);
    await t.reviewOk({ internship, entry, approve: true });

    const internBefore = t.chain.getBalance(t.intern.publicKey);
    const lockedBefore = t.chain.getBalance(internship);
    const result = await t.claim({ internship });
    expectOk(result);
    assert.equal(t.chain.getBalance(t.intern.publicKey) - internBefore, STIPEND);
    assert.equal(lockedBefore - t.chain.getBalance(internship), STIPEND);
    assert.equal(t.internshipAccount(internship).paidCount, 1);

    const [event] = eventsIn(result);
    assert.equal(event.name, 'StipendClaimed');
    assert.equal(event.data.days, 1);
    assert.equal(event.data.amount.toString(), STIPEND.toString());
  });

  test('auto-approved days are paid too', async () => {
    const { t, internship } = await setup();
    const entry = await writeDay(t, internship, 0);
    t.chain.setTime(START + 60 + REVIEW_SECS + 1);
    await t.finalizeOk({ internship, entry });

    const internBefore = t.chain.getBalance(t.intern.publicKey);
    await t.claimOk({ internship });
    assert.equal(t.chain.getBalance(t.intern.publicKey) - internBefore, STIPEND);
  });

  test('several claims only pay the days that were not paid yet', async () => {
    const { t, internship } = await setup();
    const intern = t.intern.publicKey;

    const day0 = await writeDay(t, internship, 0);
    await t.reviewOk({ internship, entry: day0, approve: true });
    let before = t.chain.getBalance(intern);
    await t.claimOk({ internship });
    assert.equal(t.chain.getBalance(intern) - before, STIPEND); // day 0
    assert.equal(t.internshipAccount(internship).paidCount, 1);

    const day1 = await writeDay(t, internship, 1);
    await t.reviewOk({ internship, entry: day1, approve: true });
    const day2 = await writeDay(t, internship, 2);
    t.chain.setTime(START + 2 * DAY + 60 + REVIEW_SECS + 1);
    await t.finalizeOk({ internship, entry: day2 }); // the supervisor stayed silent on day 2
    before = t.chain.getBalance(intern);
    await t.claimOk({ internship });
    assert.equal(t.chain.getBalance(intern) - before, 2n * STIPEND); // days 1 and 2
    assert.equal(t.internshipAccount(internship).paidCount, 3);

    expectAnchorError(await t.claim({ internship }), 'NothingToClaim'); // nothing new since
  });

  test('a fully approved internship pays everything out and keeps exactly its rent minimum', async () => {
    const { t, internship } = await setup({ totalPeriods: 3 });
    const rent = t.chain.rentExemptMinimum(INTERNSHIP_SIZE);
    assert.equal(t.chain.getBalance(internship), rent + 3n * STIPEND);
    const internStart = t.chain.getBalance(t.intern.publicKey);

    for (const day of [0, 1, 2]) {
      const entry = await writeDay(t, internship, day);
      await t.reviewOk({ internship, entry, approve: true });
    }
    await t.claimOk({ internship });

    assert.equal(t.chain.getBalance(internship), rent);
    const pageRent = 3n * t.chain.rentExemptMinimum(ENTRY_SIZE); // the intern paid for 3 pages
    assert.equal(t.chain.getBalance(t.intern.publicKey), internStart - pageRent + 3n * STIPEND);
  });

  test('an intern who registered themselves gets their own locked stipend back', async () => {
    const t = new ParafTest();
    const start = t.chain.getBalance(t.intern.publicKey);
    const internship = await t.registerOk({
      coordinator: t.intern,
      intern: t.intern.publicKey,
      totalPeriods: 2,
      stipendPerPeriod: STIPEND,
    });
    const rent = t.chain.rentExemptMinimum(INTERNSHIP_SIZE);
    assert.equal(start - t.chain.getBalance(t.intern.publicKey), rent + 2n * STIPEND);

    for (const day of [0, 1]) {
      const entry = await writeDay(t, internship, day);
      await t.reviewOk({ internship, entry, approve: true });
    }
    await t.claimOk({ internship });
    // All of the stipend came back. Only the rent of the new accounts was spent.
    const pageRent = 2n * t.chain.rentExemptMinimum(ENTRY_SIZE);
    assert.equal(start - t.chain.getBalance(t.intern.publicKey), rent + pageRent);
  });

  test('NothingToClaim: no page, a pending page and a rejected page are not paid', async () => {
    const { t, internship } = await setup();
    expectAnchorError(await t.claim({ internship }), 'NothingToClaim'); // no pages yet
    const entry = await writeDay(t, internship, 0);
    expectAnchorError(await t.claim({ internship }), 'NothingToClaim'); // still pending
    await t.reviewOk({ internship, entry, approve: false });
    expectAnchorError(await t.claim({ internship }), 'NothingToClaim'); // rejected
  });

  test('NothingToClaim: an internship without a stipend', async () => {
    const { t, internship } = await setup({ stipendPerPeriod: 0n });
    const entry = await writeDay(t, internship, 0);
    await t.reviewOk({ internship, entry, approve: true });
    expectAnchorError(await t.claim({ internship }), 'NothingToClaim');
  });

  test('NotIntern: only the intern can claim', async () => {
    const { t, internship } = await setup();
    const entry = await writeDay(t, internship, 0);
    await t.reviewOk({ internship, entry, approve: true });
    const locked = t.chain.getBalance(internship);

    for (const wallet of [t.supervisor, t.coordinator, t.stranger]) {
      const error = expectAnchorError(await t.claim({ internship, intern: wallet }), 'NotIntern');
      assert.equal(error.origin, 'internship');
    }
    assert.equal(t.chain.getBalance(internship), locked);
    assert.equal(t.internshipAccount(internship).paidCount, 0);
  });

  test('stipend for rejected and unwritten days stays locked (there is no refund instruction)', async () => {
    const { t, internship } = await setup({ totalPeriods: 3 });
    const day0 = await writeDay(t, internship, 0);
    await t.reviewOk({ internship, entry: day0, approve: true });
    const day1 = await writeDay(t, internship, 1);
    await t.reviewOk({ internship, entry: day1, approve: false });
    // Day 2: no page.

    t.chain.setTime(START + 3 * DAY + REVIEW_SECS + 1); // the internship and every window are over
    await t.claimOk({ internship });
    expectAnchorError(await t.claim({ internship }), 'NothingToClaim');
    // Current behaviour: 2 days of stipend remain, and none of the 5 instructions can move them.
    assert.equal(t.chain.getBalance(internship), t.chain.rentExemptMinimum(INTERNSHIP_SIZE) + 2n * STIPEND);
  });

  test('InsufficientFunds: unreachable in normal use, but the guard works if rent ever went up', async () => {
    // The whole stipend is locked at registration and each day can be approved only once, so a claim
    // never asks for more than the account holds. Only a network-wide rent increase could make the
    // rent reserve eat into the stipend. The local VM can simulate that by changing the Rent sysvar.
    const { t, internship } = await setup({ totalPeriods: 3 });
    const entry = await writeDay(t, internship, 0);
    await t.reviewOk({ internship, entry, approve: true });
    const balance = t.chain.getBalance(internship); // rent + 3 days of stipend

    t.chain.setRentPerByte(14_000); // about twice today's price (6,960)
    const left = balance - t.chain.rentExemptMinimum(INTERNSHIP_SIZE);
    assert.ok(left > 0n && left < STIPEND); // less than one day's stipend above the new reserve
    expectAnchorError(await t.claim({ internship }), 'InsufficientFunds');

    t.chain.setRentPerByte(20_000); // now the reserve is bigger than the whole balance
    assert.ok(t.chain.rentExemptMinimum(INTERNSHIP_SIZE) > balance);
    expectAnchorError(await t.claim({ internship }), 'InsufficientFunds');

    t.chain.setRentPerByte(6_960); // back to the normal price: the same claim works
    await t.claimOk({ internship });
    assert.equal(t.chain.getBalance(internship), balance - STIPEND);
  });
});
