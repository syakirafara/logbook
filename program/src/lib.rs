//! Paraf: an internship logbook on Solana.
//!
//! The rules this program enforces:
//! 1. An intern can only write the page for the current day, so pages cannot be backdated.
//! 2. The supervisor approves or rejects a page inside a fixed review window.
//! 3. If the supervisor stays silent until the window closes, anyone can finalize the page
//!    and it counts as approved ("silence = approval").
//! 4. Optional stipend: the coordinator locks the whole stipend when registering the internship,
//!    and the intern can only claim it for approved days. Stipend for other days stays locked
//!    (there is no refund instruction yet).
//!
//! Trust: the coordinator is trusted to name the right intern and supervisor wallets,
//! so apps should show who the coordinator of an internship is.
//!
//! Built with Anchor 0.29 so it compiles in Solana Playground (beta.solpg.io).

use anchor_lang::prelude::*;
use anchor_lang::system_program;

// The program deployed on devnet. Solana Playground replaces this with your own program ID
// when you click Build, so a fresh deploy from another Playground wallet gets a different ID.
declare_id!("C5gK2wuixKeNhcjAhLE2jzwNG3NwbD4ca1AQyznmnPH4");

/// Maximum length of the host organisation name, in bytes.
pub const MAX_HOST_ORG_LEN: usize = 40;
/// Maximum length of the public page summary, in bytes.
pub const MAX_SUMMARY_LEN: usize = 160;
/// Shortest allowed day length / review window, in seconds (short values are for demos and tests).
pub const MIN_WINDOW_SECS: u32 = 10;
/// Longest allowed day length / review window, in seconds (31 days).
pub const MAX_WINDOW_SECS: u32 = 31 * 24 * 60 * 60;
/// Maximum number of days (pages) in one internship.
pub const MAX_PERIODS: u16 = 400;
/// A start time may be this many seconds in the past, because computer clocks differ a little (5 minutes).
pub const START_GRACE_SECS: i64 = 5 * 60;
/// A start time may be at most this many seconds in the future (366 days).
pub const MAX_START_AHEAD_SECS: i64 = 366 * 24 * 60 * 60;

#[program]
pub mod paraf {
    use super::*;

    /// The coordinator (for example the campus) registers an internship.
    /// If a stipend is set, the whole amount is locked inside the internship account right away,
    /// so every approved day can always be paid.
    #[allow(clippy::too_many_arguments)]
    pub fn register_internship(
        ctx: Context<RegisterInternship>,
        internship_id: u64,
        intern: Pubkey,
        supervisor: Pubkey,
        host_org: String,
        start_ts: i64,
        period_secs: u32,
        review_secs: u32,
        total_periods: u16,
        stipend_per_period: u64,
    ) -> Result<()> {
        require_keys_neq!(intern, supervisor, ParafError::SupervisorIsIntern);
        require!(host_org.len() <= MAX_HOST_ORG_LEN, ParafError::HostOrgTooLong);

        let now = Clock::get()?.unix_timestamp;
        // start_ts = 0 means "start now".
        let start_ts = if start_ts == 0 { now } else { start_ts };
        require!(
            (MIN_WINDOW_SECS..=MAX_WINDOW_SECS).contains(&period_secs)
                && (MIN_WINDOW_SECS..=MAX_WINDOW_SECS).contains(&review_secs)
                && (1..=MAX_PERIODS).contains(&total_periods)
                // Not in the past: days that already went by could never be written (no backdating).
                && start_ts >= now - START_GRACE_SECS
                // Not more than a year ahead. This also catches milliseconds sent instead of seconds.
                && start_ts <= now + MAX_START_AHEAD_SECS,
            ParafError::InvalidSchedule
        );

        // Lock the whole stipend up front.
        let total_stipend = stipend_per_period
            .checked_mul(total_periods as u64)
            .ok_or(ParafError::MathOverflow)?;
        if total_stipend > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.coordinator.to_account_info(),
                        to: ctx.accounts.internship.to_account_info(),
                    },
                ),
                total_stipend,
            )?;
        }

        let internship = &mut ctx.accounts.internship;
        internship.intern = intern;
        internship.supervisor = supervisor;
        internship.coordinator = ctx.accounts.coordinator.key();
        internship.internship_id = internship_id;
        internship.start_ts = start_ts;
        internship.period_secs = period_secs;
        internship.review_secs = review_secs;
        internship.total_periods = total_periods;
        internship.stipend_per_period = stipend_per_period;
        internship.submitted_count = 0;
        internship.approved_count = 0;
        internship.auto_approved_count = 0;
        internship.rejected_count = 0;
        internship.paid_count = 0;
        internship.bump = ctx.bumps.internship;
        internship.host_org = host_org;

        emit!(InternshipRegistered {
            internship: internship.key(),
            intern,
            supervisor,
            coordinator: internship.coordinator,
            total_stipend,
        });
        Ok(())
    }

    /// The intern writes the page for the current day.
    /// Each page can only be written once, and only during its own day.
    /// The full text stays off-chain; only a short public summary and a salted hash of the full text are stored.
    pub fn submit_entry(
        ctx: Context<SubmitEntry>,
        period_index: u16,
        summary: String,
        detail_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            !summary.is_empty() && summary.len() <= MAX_SUMMARY_LEN,
            ParafError::InvalidSummary
        );

        let now = Clock::get()?.unix_timestamp;
        let internship = &mut ctx.accounts.internship;
        require!(now >= internship.start_ts, ParafError::NotStarted);

        // Which day is it right now? The blockchain clock decides, not the intern's laptop.
        let current_period = (now - internship.start_ts) / internship.period_secs as i64;
        require!(
            current_period < internship.total_periods as i64,
            ParafError::InternshipEnded
        );
        require!(
            current_period == period_index as i64,
            ParafError::NotCurrentPeriod
        );

        let entry = &mut ctx.accounts.entry;
        entry.internship = internship.key();
        entry.period_index = period_index;
        entry.status = EntryStatus::Pending;
        entry.reason_code = 0;
        entry.submitted_at = now;
        entry.reviewed_at = 0;
        entry.detail_hash = detail_hash;
        entry.bump = ctx.bumps.entry;
        entry.summary = summary;

        internship.submitted_count = internship
            .submitted_count
            .checked_add(1)
            .ok_or(ParafError::MathOverflow)?;

        emit!(EntrySubmitted {
            internship: entry.internship,
            period_index,
            submitted_at: now,
        });
        Ok(())
    }

    /// The supervisor approves or rejects a page while its review window is open.
    pub fn review_entry(ctx: Context<ReviewEntry>, approve: bool, reason_code: u8) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let internship = &mut ctx.accounts.internship;
        let entry = &mut ctx.accounts.entry;
        require!(entry.status == EntryStatus::Pending, ParafError::NotPending);

        let review_deadline = entry.submitted_at + internship.review_secs as i64;
        require!(now <= review_deadline, ParafError::ReviewWindowClosed);

        entry.reviewed_at = now;
        entry.reason_code = reason_code;
        if approve {
            entry.status = EntryStatus::Approved;
            internship.approved_count = internship
                .approved_count
                .checked_add(1)
                .ok_or(ParafError::MathOverflow)?;
        } else {
            entry.status = EntryStatus::Rejected;
            internship.rejected_count = internship
                .rejected_count
                .checked_add(1)
                .ok_or(ParafError::MathOverflow)?;
        }

        emit!(EntryReviewed {
            internship: internship.key(),
            period_index: entry.period_index,
            approved: approve,
            reason_code,
        });
        Ok(())
    }

    /// Anyone can finalize a page whose review window has passed without a decision.
    /// Silence counts as approval.
    pub fn finalize_entry(ctx: Context<FinalizeEntry>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let internship = &mut ctx.accounts.internship;
        let entry = &mut ctx.accounts.entry;
        require!(entry.status == EntryStatus::Pending, ParafError::NotPending);

        let review_deadline = entry.submitted_at + internship.review_secs as i64;
        require!(now > review_deadline, ParafError::ReviewWindowOpen);

        entry.status = EntryStatus::AutoApproved;
        entry.reviewed_at = now;
        internship.approved_count = internship
            .approved_count
            .checked_add(1)
            .ok_or(ParafError::MathOverflow)?;
        internship.auto_approved_count = internship
            .auto_approved_count
            .checked_add(1)
            .ok_or(ParafError::MathOverflow)?;

        emit!(EntryAutoApproved {
            internship: internship.key(),
            period_index: entry.period_index,
        });
        Ok(())
    }

    /// The intern collects the stipend for every approved day that has not been paid yet.
    pub fn claim_stipend(ctx: Context<ClaimStipend>) -> Result<()> {
        let internship = &mut ctx.accounts.internship;
        let unpaid_days = internship
            .approved_count
            .checked_sub(internship.paid_count)
            .ok_or(ParafError::MathOverflow)?;
        let amount = (unpaid_days as u64)
            .checked_mul(internship.stipend_per_period)
            .ok_or(ParafError::MathOverflow)?;
        require!(amount > 0, ParafError::NothingToClaim);

        // The account must keep its rent-exempt minimum, so only the rest is available.
        let internship_info = internship.to_account_info();
        let rent_minimum = Rent::get()?.minimum_balance(internship_info.data_len());
        let available = internship_info
            .lamports()
            .checked_sub(rent_minimum)
            .ok_or(ParafError::InsufficientFunds)?;
        require!(available >= amount, ParafError::InsufficientFunds);

        // This program owns the internship account, so it can move lamports out of it directly.
        **internship_info.try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .intern
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        internship.paid_count = internship.approved_count;

        emit!(StipendClaimed {
            internship: internship.key(),
            days: unpaid_days,
            amount,
        });
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Accounts for each instruction
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(internship_id: u64)]
pub struct RegisterInternship<'info> {
    #[account(
        init,
        payer = coordinator,
        space = 8 + Internship::INIT_SPACE,
        seeds = [b"internship", coordinator.key().as_ref(), &internship_id.to_le_bytes()],
        bump
    )]
    pub internship: Account<'info, Internship>,
    #[account(mut)]
    pub coordinator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(period_index: u16)]
pub struct SubmitEntry<'info> {
    #[account(mut, has_one = intern @ ParafError::NotIntern)]
    pub internship: Account<'info, Internship>,
    // One page per day: the address comes from the internship and the day number,
    // and `init` fails if the page already exists, so a page can never be overwritten.
    #[account(
        init,
        payer = intern,
        space = 8 + Entry::INIT_SPACE,
        seeds = [b"entry", internship.key().as_ref(), &period_index.to_le_bytes()],
        bump
    )]
    pub entry: Account<'info, Entry>,
    #[account(mut)]
    pub intern: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReviewEntry<'info> {
    #[account(mut, has_one = supervisor @ ParafError::NotSupervisor)]
    pub internship: Account<'info, Internship>,
    #[account(mut, has_one = internship @ ParafError::WrongInternship)]
    pub entry: Account<'info, Entry>,
    pub supervisor: Signer<'info>,
}

#[derive(Accounts)]
pub struct FinalizeEntry<'info> {
    #[account(mut)]
    pub internship: Account<'info, Internship>,
    #[account(mut, has_one = internship @ ParafError::WrongInternship)]
    pub entry: Account<'info, Entry>,
}

#[derive(Accounts)]
pub struct ClaimStipend<'info> {
    #[account(mut, has_one = intern @ ParafError::NotIntern)]
    pub internship: Account<'info, Internship>,
    #[account(mut)]
    pub intern: Signer<'info>,
}

// ---------------------------------------------------------------------------
// Data stored on-chain
// ---------------------------------------------------------------------------

/// One internship placement. Its lamports (above the rent minimum) are the locked stipend.
#[account]
#[derive(InitSpace)]
pub struct Internship {
    pub intern: Pubkey,
    pub supervisor: Pubkey,
    pub coordinator: Pubkey,
    pub internship_id: u64,
    /// Unix time when day 0 starts.
    pub start_ts: i64,
    /// Length of one "day" in seconds (86400 in real use, a few minutes in demos).
    pub period_secs: u32,
    /// How long the supervisor has to review a page, counted from when it was submitted.
    pub review_secs: u32,
    pub total_periods: u16,
    /// Stipend per approved day, in lamports (0 = no stipend).
    pub stipend_per_period: u64,
    pub submitted_count: u16,
    /// Approved by the supervisor or auto-approved. These days are payable.
    pub approved_count: u16,
    pub auto_approved_count: u16,
    pub rejected_count: u16,
    pub paid_count: u16,
    pub bump: u8,
    #[max_len(MAX_HOST_ORG_LEN)]
    pub host_org: String,
}

/// One logbook page (one per day).
#[account]
#[derive(InitSpace)]
pub struct Entry {
    pub internship: Pubkey,
    pub period_index: u16,
    pub status: EntryStatus,
    /// Optional reason chosen by the supervisor (meaning is defined by the app).
    pub reason_code: u8,
    pub submitted_at: i64,
    pub reviewed_at: i64,
    /// SHA-256 of (a random salt + the full private text). Both stay off-chain.
    /// The salt stops anyone from finding short texts like "Sick" by hashing guesses.
    pub detail_hash: [u8; 32],
    pub bump: u8,
    /// Short public summary. Everything on-chain is public forever.
    #[max_len(MAX_SUMMARY_LEN)]
    pub summary: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EntryStatus {
    Pending,
    Approved,
    Rejected,
    AutoApproved,
}

// ---------------------------------------------------------------------------
// Events (shown in transaction logs)
// ---------------------------------------------------------------------------

#[event]
pub struct InternshipRegistered {
    pub internship: Pubkey,
    pub intern: Pubkey,
    pub supervisor: Pubkey,
    pub coordinator: Pubkey,
    pub total_stipend: u64,
}

#[event]
pub struct EntrySubmitted {
    pub internship: Pubkey,
    pub period_index: u16,
    pub submitted_at: i64,
}

#[event]
pub struct EntryReviewed {
    pub internship: Pubkey,
    pub period_index: u16,
    pub approved: bool,
    pub reason_code: u8,
}

#[event]
pub struct EntryAutoApproved {
    pub internship: Pubkey,
    pub period_index: u16,
}

#[event]
pub struct StipendClaimed {
    pub internship: Pubkey,
    pub days: u16,
    pub amount: u64,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum ParafError {
    #[msg("Supervisor and intern must be different wallets")]
    SupervisorIsIntern,
    #[msg("Host organisation name is too long (max 40 bytes)")]
    HostOrgTooLong,
    #[msg("Invalid schedule: check the start time, day length, review window and number of days")]
    InvalidSchedule,
    #[msg("Number too large")]
    MathOverflow,
    #[msg("The internship has not started yet")]
    NotStarted,
    #[msg("The internship has already ended")]
    InternshipEnded,
    #[msg("You can only write the page for today")]
    NotCurrentPeriod,
    #[msg("Summary must be between 1 and 160 bytes")]
    InvalidSummary,
    #[msg("Only the intern of this internship can do this")]
    NotIntern,
    #[msg("Only the supervisor of this internship can do this")]
    NotSupervisor,
    #[msg("This page belongs to a different internship")]
    WrongInternship,
    #[msg("This page has already been reviewed")]
    NotPending,
    #[msg("The review window has closed")]
    ReviewWindowClosed,
    #[msg("The review window is still open")]
    ReviewWindowOpen,
    #[msg("Nothing to claim yet")]
    NothingToClaim,
    #[msg("Not enough stipend left in this internship")]
    InsufficientFunds,
}
