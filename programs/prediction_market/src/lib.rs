pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("GF2HqG2UJWmB7YPGsyqAg1p5wWaRpufKfp9anM7oWTet");

#[program]
pub mod prediction_market {
    use super::*;

    /// Initialize the prediction market program
    pub fn initialize(
        ctx: Context<Initialize>,
        fee_recipient: Pubkey,
        max_fee_bps: u16,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, fee_recipient, max_fee_bps)
    }

    /// Update the global configuration (admin only)
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        fee_recipient: Pubkey,
        max_fee_bps: u16,
    ) -> Result<()> {
        instructions::update_config::handler(ctx, fee_recipient, max_fee_bps)
    }

    /// Pause the contract (admin only)
    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        instructions::pause::pause_handler(ctx)
    }

    /// Unpause the contract (admin only)
    pub fn unpause(ctx: Context<Pause>) -> Result<()> {
        instructions::pause::unpause_handler(ctx)
    }

    /// Create a new prediction market
    pub fn create_market(
        ctx: Context<CreateMarket>,
        question: String,
        resolution_time: i64,
        fee_amount: u64,
    ) -> Result<()> {
        instructions::create_market::handler(ctx, question, resolution_time, fee_amount)
    }

    /// Place a bet on a market
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        market_id: u64,
        outcome: Outcome,
        amount: u64,
    ) -> Result<()> {
        instructions::place_bet::handler(ctx, market_id, outcome, amount)
    }

    /// Resolve a market (admin only)
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        market_id: u64,
        winning_outcome: Outcome,
    ) -> Result<()> {
        instructions::resolve_market::handler(ctx, market_id, winning_outcome)
    }

    /// Cancel a market (admin only)
    pub fn cancel_market(ctx: Context<CancelMarket>, market_id: u64) -> Result<()> {
        instructions::cancel_market::handler(ctx, market_id)
    }

    /// Claim winnings from a resolved or cancelled market
    pub fn claim_winnings(ctx: Context<ClaimWinnings>, market_id: u64) -> Result<()> {
        instructions::claim_winnings::handler(ctx, market_id)
    }

    /// Stake tokens and commit to a blind prediction (commit-reveal scheme)
    pub fn stake_and_commit(
        ctx: Context<StakeAndCommit>,
        market_id: u64,
        amount: u64,
        commitment: [u8; 32],
    ) -> Result<()> {
        instructions::stake_and_commit::handler(ctx, market_id, amount, commitment)
    }

    /// Reveal the committed outcome and claim fixed-odds winnings (5x payout)
    pub fn reveal_and_claim(
        ctx: Context<RevealAndClaim>,
        market_id: u64,
        outcome: Outcome,
        salt: [u8; 32],
    ) -> Result<()> {
        instructions::reveal_and_claim::handler(ctx, market_id, outcome, salt)
    }
}
