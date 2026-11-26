// register_internship: the coordinator creates an internship and locks the whole stipend.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  DAY,
  INTERNSHIP_SIZE,
  MAX_START_AHEAD_SECS,
  REVIEW_SECS,
  START,
  START_GRACE_SECS,
  TEST_PROGRAM_ID,
  ParafTest,
  eventsIn,
  expectAnchorError,
  expectOk,
  expectSystemProgramError,
  findInternshipAddress,
} from './paraf.mjs';

describe('register_internship', () => {
  test('stores the internship, and start_ts = 0 means "start now"', async () => {
    const t = new ParafTest();
    const coordinatorBefore = t.chain.getBalance(t.coordinator.publicKey);
    const result = await t.register({ internshipId: 7, hostOrg: 'Example Host Org', totalPeriods: 20 });
    expectOk(result);

    const [address, bump] = findInternshipAddress(t.coordinator.publicKey, 7);
    assert.ok(result.internship.equals(address));
    const internship = t.internshipAccount(address);
    assert.ok(internship.intern.equals(t.intern.publicKey));
    assert.ok(internship.supervisor.equals(t.supervisor.publicKey));
    assert.ok(internship.coordinator.equals(t.coordinator.publicKey));
    assert.equal(internship.internshipId.toNumber(), 7);
    assert.equal(internship.startTs.toNumber(), START); // 0 was replaced by the chain time
    assert.equal(internship.periodSecs, DAY);
    assert.equal(internship.reviewSecs, REVIEW_SECS);
    assert.equal(internship.totalPeriods, 20);
    assert.equal(internship.stipendPerPeriod.toNumber(), 0);
    for (const count of ['submittedCount', 'approvedCount', 'autoApprovedCount', 'rejectedCount', 'paidCount']) {
      assert.equal(internship[count], 0, count);
    }
    assert.equal(internship.bump, bump);
    assert.equal(internship.hostOrg, 'Example Host Org');

    // The account belongs to the program and, with no stipend, holds only its rent.
    const account = t.chain.getAccount(address);
    assert.ok(account.owner.equals(TEST_PROGRAM_ID));
    assert.equal(account.data.length, INTERNSHIP_SIZE);
    assert.equal(account.lamports, t.chain.rentExemptMinimum(INTERNSHIP_SIZE));
    assert.equal(coordinatorBefore - t.chain.getBalance(t.coordinator.publicKey), account.lamports);

    const [event] = eventsIn(result);
    assert.equal(event.name, 'InternshipRegistered');
    assert.ok(event.data.internship.equals(address));
    assert.ok(event.data.intern.equals(t.intern.publicKey));
    assert.equal(event.data.totalStipend.toNumber(), 0);
  });

  test('locks the whole stipend in the internship account', async () => {
    const t = new ParafTest();
    const coordinatorBefore = t.chain.getBalance(t.coordinator.publicKey);
    const result = await t.register({ totalPeriods: 5, stipendPerPeriod: 1_000_000n });
    expectOk(result);

    const rent = t.chain.rentExemptMinimum(INTERNSHIP_SIZE);
    assert.equal(t.chain.getBalance(result.internship), rent + 5_000_000n);
    assert.equal(coordinatorBefore - t.chain.getBalance(t.coordinator.publicKey), rent + 5_000_000n);
    assert.equal(eventsIn(result)[0].data.totalStipend.toNumber(), 5_000_000);
  });

  test('an intern can register their own internship (coordinator = intern)', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk({ coordinator: t.intern, intern: t.intern.publicKey });
    assert.ok(internship.equals(findInternshipAddress(t.intern.publicKey, 1)[0]));
    const account = t.internshipAccount(internship);
    assert.ok(account.coordinator.equals(t.intern.publicKey));
    assert.ok(account.intern.equals(t.intern.publicKey));
  });

  test('a start time in the future is stored as given', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk({ startTs: START + 3 * DAY });
    assert.equal(t.internshipAccount(internship).startTs.toNumber(), START + 3 * DAY);
  });

  test('a start time up to 5 minutes in the past is accepted (computer clocks differ a little)', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk({ startTs: START - START_GRACE_SECS });
    assert.equal(t.internshipAccount(internship).startTs.toNumber(), START - START_GRACE_SECS);
    await t.submitOk({ internship, periodIndex: 0 }); // day 0 is still today
  });

  test('a start time 366 days ahead is accepted', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk({ startTs: START + MAX_START_AHEAD_SECS });
    assert.equal(t.internshipAccount(internship).startTs.toNumber(), START + MAX_START_AHEAD_SECS);
  });

  test('InvalidSchedule: a past start time is refused, so no stipend gets stuck in an internship nobody can use', async () => {
    // Ten days ago, for a five-day internship: it would already be over, and no page could ever be written.
    const t = new ParafTest();
    const before = t.chain.getBalance(t.coordinator.publicKey);
    const result = await t.register({ startTs: START - 10 * DAY, totalPeriods: 5, stipendPerPeriod: 1_000_000n });
    expectAnchorError(result, 'InvalidSchedule');
    assert.equal(t.chain.getAccount(result.internship), null);
    assert.equal(t.chain.getBalance(t.coordinator.publicKey), before); // the stipend never left the coordinator
  });

  test('InvalidSchedule: a start time in milliseconds (JavaScript Date.now()) is refused', async () => {
    // Milliseconds read as seconds would mean a start tens of thousands of years from now.
    const t = new ParafTest();
    const before = t.chain.getBalance(t.coordinator.publicKey);
    const result = await t.register({ startTs: START * 1000, stipendPerPeriod: 1_000_000n });
    expectAnchorError(result, 'InvalidSchedule');
    assert.equal(t.chain.getAccount(result.internship), null);
    assert.equal(t.chain.getBalance(t.coordinator.publicKey), before);
  });

  test('a coordinator cannot reuse an internship id, but another coordinator can', async () => {
    const t = new ParafTest();
    const first = await t.registerOk({ internshipId: 1 });
    // The address is already taken, so the System Program refuses to create it again.
    expectSystemProgramError(await t.register({ internshipId: 1, supervisor: t.stranger.publicKey }), 0, 'already in use');
    assert.ok(t.internshipAccount(first).supervisor.equals(t.supervisor.publicKey)); // unchanged

    const other = await t.registerOk({ internshipId: 1, coordinator: t.stranger });
    assert.ok(!other.equals(first));
  });

  test('the address must be the PDA of [coordinator, internship_id]', async () => {
    const t = new ParafTest();
    const [wrongAddress] = findInternshipAddress(t.coordinator.publicKey, 2);
    const error = expectAnchorError(await t.register({ internshipId: 1, internship: wrongAddress }), 'ConstraintSeeds');
    assert.equal(error.origin, 'internship');
  });

  test('fails if the coordinator cannot pay the whole stipend', async () => {
    const t = new ParafTest();
    const coordinator = t.newWallet(1); // 1 SOL, but the stipend is 5 x 1 SOL
    const result = await t.register({ coordinator, totalPeriods: 5, stipendPerPeriod: 1_000_000_000n });
    expectSystemProgramError(result, 1, 'insufficient lamports');
    assert.equal(t.chain.getAccount(result.internship), null);
    assert.equal(t.chain.getBalance(coordinator.publicKey), 1_000_000_000n);
  });

  test('SupervisorIsIntern: the supervisor cannot be the intern', async () => {
    const t = new ParafTest();
    const result = await t.register({ supervisor: t.intern.publicKey });
    expectAnchorError(result, 'SupervisorIsIntern');
    assert.equal(t.chain.getAccount(result.internship), null);
  });

  test('HostOrgTooLong: the name is limited to 40 bytes, not 40 characters', async () => {
    const t = new ParafTest();
    expectAnchorError(await t.register({ internshipId: 1, hostOrg: 'a'.repeat(41) }), 'HostOrgTooLong');
    // "é" is 2 bytes in UTF-8: 21 of them are only 21 characters but 42 bytes.
    expectAnchorError(await t.register({ internshipId: 1, hostOrg: 'é'.repeat(21) }), 'HostOrgTooLong');

    await t.registerOk({ internshipId: 1, hostOrg: 'a'.repeat(40) });
    const internship = await t.registerOk({ internshipId: 2, hostOrg: 'é'.repeat(20) }); // exactly 40 bytes
    assert.equal(t.internshipAccount(internship).hostOrg, 'é'.repeat(20));
  });

  const badSchedules = [
    ['a day shorter than 10 seconds', { periodSecs: 9 }],
    ['a day longer than 31 days', { periodSecs: 31 * DAY + 1 }],
    ['a review window shorter than 10 seconds', { reviewSecs: 9 }],
    ['a review window longer than 31 days', { reviewSecs: 31 * DAY + 1 }],
    ['zero days', { totalPeriods: 0 }],
    ['more than 400 days', { totalPeriods: 401 }],
    ['a negative start time', { startTs: -1 }],
    ['a start time more than 5 minutes in the past', { startTs: START - START_GRACE_SECS - 1 }],
    ['a start time more than 366 days ahead', { startTs: START + MAX_START_AHEAD_SECS + 1 }],
  ];
  for (const [what, schedule] of badSchedules) {
    test(`InvalidSchedule: ${what}`, async () => {
      const t = new ParafTest();
      const result = await t.register(schedule);
      expectAnchorError(result, 'InvalidSchedule');
      assert.equal(t.chain.getAccount(result.internship), null);
    });
  }

  test('the schedule limits themselves are allowed', async () => {
    const t = new ParafTest();
    await t.registerOk({ internshipId: 1, periodSecs: 10, reviewSecs: 10, totalPeriods: 1, startTs: START - START_GRACE_SECS });
    await t.registerOk({
      internshipId: 2,
      periodSecs: 31 * DAY,
      reviewSecs: 31 * DAY,
      totalPeriods: 400,
      startTs: START + MAX_START_AHEAD_SECS,
    });
  });

  test('MathOverflow: a total stipend that does not fit in a u64', async () => {
    const t = new ParafTest();
    // 2^63 lamports x 2 days = 2^64, one more than the largest u64.
    const result = await t.register({ totalPeriods: 2, stipendPerPeriod: 2n ** 63n });
    expectAnchorError(result, 'MathOverflow');
    assert.equal(t.chain.getAccount(result.internship), null);
  });
});
