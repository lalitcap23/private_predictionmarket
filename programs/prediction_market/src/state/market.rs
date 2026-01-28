use anchor_lang::prelude::*;

/// Market state enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MarketState {
    Active,
    Resolved,
    Cancelled,
}

/// Outcome enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum Outcome {
    None,
    Yes,
    No,
}

/// Market account storing all market data
#[account]
#[derive(InitSpace)]
pub struct Market {
    /// Unique market ID
    pub id: u64,
    /// Market question (max 200 chars)
    #[max_len(200)]
    pub question: String,
    /// Resolution time (unix timestamp)
    pub resolution_time: i64,
    /// Current market state
    pub state: MarketState,
    /// Winning outcome (if resolved)
    pub winning_outcome: Outcome,
    /// Total YES pool amount
    pub yes_pool: u64,
    /// Total NO pool amount
    pub no_pool: u64,
    /// Creation fee paid
    pub creation_fee: u64,
    /// Market creator
    pub creator: Pubkey,
    /// Created at timestamp
    pub created_at: i64,
    /// Config snapshot - fee recipient
    pub config_fee_recipient: Pubkey,
    /// Config snapshot - max fee bps
    pub config_max_fee_bps: u16,
    /// Bump seed for PDA
    pub bump: u8,
    /// Vault bump seed
    pub vault_bump: u8,
    /// Pyth price feed ID (32 bytes) - None if manual resolution
    pub pyth_price_feed_id: Option<[u8; 32]>,
    /// Price threshold for YES outcome (in Pyth's native format with exponent)
    /// If price >= threshold, YES wins; else NO wins
    /// None if manual resolution
    pub price_threshold: Option<i64>,
    /// Reveal deadline (unix timestamp) - deadline for users to reveal after market resolution
    /// Set to resolution_time + 2 weeks when market is resolved
    /// 0 if market not yet resolved
    pub reveal_deadline: i64,
}

impl Market {
    pub const SEED: &'static [u8] = b"market";
    pub const VAULT_SEED: &'static [u8] = b"vault";
}
