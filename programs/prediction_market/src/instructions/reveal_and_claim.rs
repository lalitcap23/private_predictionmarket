use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};
use sha2::{Sha256, Digest};


use crate::error::PredictionMarketError;
use crate::state::{Market, MarketState, Outcome, UserPosition};

/// Reveal the committed outcome and claim fixed-odds winnings.
///
/// The client must pass the same preimage used to construct the commitment:
/// SHA256(market_id || user_pubkey || outcome_discriminant || salt)
#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct RevealAndClaim<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [Market::SEED, market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.state == MarketState::Resolved @ PredictionMarketError::MarketNotFinalized
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [Market::VAULT_SEED, market_id.to_le_bytes().as_ref()],
        bump = market.vault_bump
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [UserPosition::SEED, market_id.to_le_bytes().as_ref(), user.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.user == user.key() @ PredictionMarketError::InvalidAdmin,
        constraint = !user_position.claimed @ PredictionMarketError::AlreadyClaimed
    )]
    pub user_position: Account<'info, UserPosition>,

    /// User's token account to receive payout
    #[account(
        mut,
        token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<RevealAndClaim>,
    market_id: u64,
    outcome: Outcome,
    salt: [u8; 32],
) -> Result<()> {
    let market = &ctx.accounts.market;
    let position = &mut ctx.accounts.user_position;
    let clock = Clock::get()?;

    // Ensure user actually committed
    require!(
        position.market_id == market_id && position.committed_amount > 0,
        PredictionMarketError::NotCommitted
    );
    require!(!position.revealed, PredictionMarketError::AlreadyRevealed);
    
    // Check reveal deadline has not passed
    require!(
        market.reveal_deadline > 0, // Market must be resolved
        PredictionMarketError::MarketNotFinalized
    );
    require!(
        clock.unix_timestamp <= market.reveal_deadline,
        PredictionMarketError::RevealDeadlineExpired
    );

    // Recompute the commitment using SHA256 (same as Solana's hashv)
    let market_id_bytes = market_id.to_le_bytes();

    let outcome_byte: u8 = match outcome {
        Outcome::None => 0,
        Outcome::Yes => 1,
        Outcome::No => 2,
    };

    let mut hasher = Sha256::new();
    hasher.update(&market_id_bytes);
    hasher.update(ctx.accounts.user.key().as_ref());
    hasher.update(&[outcome_byte]);
    hasher.update(&salt);
    let computed = hasher.finalize();

    require!(
        computed.as_slice() == position.commitment.as_slice(),
        PredictionMarketError::InvalidCommitment
    );

    // Mark revealed and store outcome
    position.revealed = true;
    position.revealed_outcome = outcome;

    // Fixed odds payout: 5x on correct prediction, 0 on incorrect
    let mut payout: u64 = 0;
    if market.winning_outcome == outcome {
        payout = position
            .committed_amount
            .checked_mul(5)
            .ok_or(PredictionMarketError::Overflow)?;
    }

    // Mark as claimed to prevent double-claim, even if payout is zero
    position.claimed = true;

    // Transfer payout if any
    if payout > 0 {
        let market_id_bytes = market_id.to_le_bytes();
        let seeds = &[Market::SEED, market_id_bytes.as_ref(), &[market.bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.market_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, payout)?;
    }

    Ok(())
}


