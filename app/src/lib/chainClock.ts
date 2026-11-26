// The blockchain's clock. The program asks it (Clock::get()) which day it is, so the app asks it too:
// even if a laptop clock is wrong, the app shows the same day and countdowns as the program.
import { SYSVAR_CLOCK_PUBKEY, type Connection } from '@solana/web3.js';

/**
 * Reads the Clock "sysvar", a special account the validators update every slot (about 0.4 s).
 * Its bytes: slot u64 @0, epoch_start_timestamp i64 @8, epoch u64 @16,
 * leader_schedule_epoch u64 @24, unix_timestamp i64 @32 (all little-endian).
 */
export async function readChainTime(connection: Connection): Promise<number> {
  const info = await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY);
  if (!info) throw new Error('Clock sysvar not found');
  const view = new DataView(info.data.buffer, info.data.byteOffset, info.data.byteLength);
  return Number(view.getBigInt64(32, true));
}
