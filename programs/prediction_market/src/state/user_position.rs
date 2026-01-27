use anchor_lang::prelude::*;

use crate::state::Outcome;

/// User position in a market
#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    /// Market ID
    pub market_id: u64,
    /// User pubkey
    pub user: Pubkey,
    /// Amount bet on YES (legacy, unused in commit-reveal flow)
    pub yes_bet: u64,
    /// Amount bet on NO (legacy, unused in commit-reveal flow)
    pub no_bet: u64,
    /// Has user claimed their payout
    pub claimed: bool,
    /// Bump seed for PDA
    pub bump: u8,
    /// Commit-reveal: keccak256(market_id, user, outcome, amount, salt)
    pub commitment: [u8; 32],
    /// Total amount committed in tickets for this market
    pub committed_amount: u64,
    /// Whether the user has already revealed their choice
    pub revealed: bool,
    /// Revealed outcome for this commitment
    pub revealed_outcome: Outcome,
}

impl UserPosition {
    pub const SEED: &'static [u8] = b"position";
}
