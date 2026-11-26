// Whole stories across several instructions, and the byte layout the web app relies on.
import { PublicKey } from '@solana/web3.js';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, test } from 'node:test';
import {
  DAY,
  ENTRY_SIZE,
  INTERNSHIP_SIZE,
  REVIEW_SECS,
  START,
  ParafTest,
  expectAnchorError,
  expectOk,
  sha256,
  statusName,
} from './paraf.mjs';

const STIPEND = 1_000_000n;

describe('a whole internship', () => {
  test('approved, rejected, silent and missed days', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk({ totalPeriods: 4, stipendPerPeriod: STIPEND });

    // Day 0: written and approved.
    t.chain.setTime(START + 9 * 3600);
    const day0 = await t.submitOk({ internship, periodIndex: 0 });
    await t.reviewOk({ internship, entry: day0, approve: true });
    // Day 1: written and rejected with reason 2.
    t.chain.setTime(START + DAY + 9 * 3600);
    const day1 = await t.submitOk({ internship, periodIndex: 1 });
    await t.reviewOk({ internship, entry: day1, approve: false, reasonCode: 2 });
    // Day 2: written, and the supervisor never answers.
    t.chain.setTime(START + 2 * DAY + 9 * 3600);
    const day2 = await t.submitOk({ internship, periodIndex: 2 });
    // Day 3: the intern forgets. After the internship it is too late.
    t.chain.setTime(START + 5 * DAY);
    expectAnchorError(await t.submit({ internship, periodIndex: 3 }), 'InternshipEnded');
    // Day 2's window has closed, so anyone can finalize it.
    await t.finalizeOk({ internship, entry: day2 });

    const before = t.chain.getBalance(t.intern.publicKey);
    await t.claimOk({ internship });
    assert.equal(t.chain.getBalance(t.intern.publicKey) - before, 2n * STIPEND); // days 0 and 2

    assert.deepEqual([day0, day1, day2].map((e) => statusName(t.entryAccount(e))), ['approved', 'rejected', 'autoApproved']);
    assert.equal(t.entryAccount(day1).reasonCode, 2);
    const counts = t.internshipAccount(internship);
    assert.deepEqual(
      [counts.submittedCount, counts.approvedCount, counts.autoApprovedCount, counts.rejectedCount, counts.paidCount],
      [3, 2, 1, 1, 2],
    );
  });

  test('finalize and claim can be sent together in one transaction', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk({ stipendPerPeriod: STIPEND });
    const entry = await t.submitOk({ internship, periodIndex: 0 });
    t.chain.setTime(START + REVIEW_SECS + 1);

    const before = t.chain.getBalance(t.intern.publicKey);
    const instructions = [
      await t.finalizeInstruction({ internship, entry }),
      await t.claimInstruction({ internship, intern: t.intern.publicKey }),
    ];
    expectOk(t.chain.send(instructions, [t.intern]));
    assert.equal(statusName(t.entryAccount(entry)), 'autoApproved');
    assert.equal(t.chain.getBalance(t.intern.publicKey) - before, STIPEND);
  });

  test('if one instruction fails, the whole transaction is undone', async () => {
    const t = new ParafTest();
    const internship = await t.registerOk({ stipendPerPeriod: STIPEND });
    const entry = await t.submitOk({ internship, periodIndex: 0 });
    t.chain.setTime(START + REVIEW_SECS + 1);

    // A stranger finalizes (allowed), then tries to claim the intern's stipend (not allowed).
    const instructions = [
      await t.finalizeInstruction({ internship, entry }),
      await t.claimInstruction({ internship, intern: t.stranger.publicKey }),
    ];
    expectAnchorError(t.chain.send(instructions, [t.stranger]), 'NotIntern');
    assert.equal(statusName(t.entryAccount(entry)), 'pending'); // the finalize was undone too
  });
});

describe('account layout (for getProgramAccounts filters in the web app)', () => {
  const discriminator = (name) => createHash('sha256').update(`account:${name}`).digest().subarray(0, 8);

  /** An internship with one page in each status: approved, rejected (reason 5), auto-approved, pending. */
  async function busyInternship() {
    const t = new ParafTest();
    const internship = await t.registerOk({
      internshipId: 0x0102030405060708n,
      hostOrg: 'Example Host Org',
      startTs: START + 100,
      periodSecs: 600,
      reviewSecs: 300,
      totalPeriods: 7,
      stipendPerPeriod: 123_456n,
    });
    const pages = [];
    for (let day = 0; day < 4; day++) {
      t.chain.setTime(START + 100 + day * 600 + 1); // one second into each 10-minute "day"
      const page = await t.submitOk({ internship, periodIndex: day, summary: `Summary ${day}`, detailHash: sha256(`notes ${day}`) });
      if (day === 0) await t.reviewOk({ internship, entry: page, approve: true });
      if (day === 1) await t.reviewOk({ internship, entry: page, approve: false, reasonCode: 5 });
      pages.push(page);
    }
    // It is now day 3, so day 2's 5-minute window closed long ago.
    await t.finalizeOk({ internship, entry: pages[2] });
    await t.claimOk({ internship });
    return { t, internship, pages };
  }

  test('Internship: 193 bytes, fields at the documented offsets', async () => {
    const { t, internship } = await busyInternship();
    const data = t.chain.getAccount(internship).data;
    assert.equal(data.length, INTERNSHIP_SIZE);
    assert.deepEqual(data.subarray(0, 8), discriminator('Internship'));
    assert.ok(new PublicKey(data.subarray(8, 40)).equals(t.intern.publicKey));
    assert.ok(new PublicKey(data.subarray(40, 72)).equals(t.supervisor.publicKey));
    assert.ok(new PublicKey(data.subarray(72, 104)).equals(t.coordinator.publicKey));
    assert.equal(data.readBigUInt64LE(104), 0x0102030405060708n); // internship_id
    assert.equal(data.readBigInt64LE(112), BigInt(START + 100)); // start_ts
    assert.equal(data.readUInt32LE(120), 600); // period_secs
    assert.equal(data.readUInt32LE(124), 300); // review_secs
    assert.equal(data.readUInt16LE(128), 7); // total_periods
    assert.equal(data.readBigUInt64LE(130), 123_456n); // stipend_per_period
    assert.equal(data.readUInt16LE(138), 4); // submitted_count
    assert.equal(data.readUInt16LE(140), 2); // approved_count (1 by the supervisor + 1 automatic)
    assert.equal(data.readUInt16LE(142), 1); // auto_approved_count
    assert.equal(data.readUInt16LE(144), 1); // rejected_count
    assert.equal(data.readUInt16LE(146), 2); // paid_count
    assert.equal(data[148], t.internshipAccount(internship).bump); // bump
    const hostOrgLength = data.readUInt32LE(149); // host_org: u32 length, then the UTF-8 bytes
    assert.equal(data.subarray(153, 153 + hostOrgLength).toString('utf8'), 'Example Host Org');
  });

  test('Entry: 257 bytes, fields at the documented offsets, status byte 0-3', async () => {
    const { t, internship, pages } = await busyInternship();
    const expectedStatus = [1, 2, 3, 0]; // Approved, Rejected, AutoApproved, Pending
    for (const [day, page] of pages.entries()) {
      const data = t.chain.getAccount(page).data;
      const decoded = t.entryAccount(page);
      assert.equal(data.length, ENTRY_SIZE);
      assert.deepEqual(data.subarray(0, 8), discriminator('Entry'));
      assert.ok(new PublicKey(data.subarray(8, 40)).equals(internship));
      assert.equal(data.readUInt16LE(40), day); // period_index
      assert.equal(data[42], expectedStatus[day]); // status
      assert.equal(data[43], day === 1 ? 5 : 0); // reason_code
      assert.equal(data.readBigInt64LE(44), BigInt(decoded.submittedAt.toString())); // submitted_at
      assert.equal(data.readBigInt64LE(52), BigInt(decoded.reviewedAt.toString())); // reviewed_at
      assert.deepEqual([...data.subarray(60, 92)], sha256(`notes ${day}`)); // detail_hash
      assert.equal(data[92], decoded.bump); // bump
      const summaryLength = data.readUInt32LE(93); // summary: u32 length, then the UTF-8 bytes
      assert.equal(data.subarray(97, 97 + summaryLength).toString('utf8'), `Summary ${day}`);
    }
  });
});
