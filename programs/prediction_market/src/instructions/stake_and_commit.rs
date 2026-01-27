use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

use crate::error::PredictionMarketError;
use crate::state::{Config, Market, MarketState, UserPosition};

/// Stake tokens and store a commitment hash for a binary market.
///
/// The client should compute the commitment as:
/// SHA256(market_id || user_pubkey || outcome_discriminant || salt)
/// where:
/// - market_id: u64 little-endian bytes
/// - user_pubkey: 32 bytes
/// - outcome_discriminant: 1 byte (0 = None, 1 = Yes, 2 = No)
/// - salt: 32 random bytes
#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct StakeAndCommit<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
        constraint = !config.paused @ PredictionMarketError::Paused
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [Market::SEED, market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.state == MarketState::Active @ PredictionMarketError::MarketNotActive
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [Market::VAULT_SEED, market_id.to_le_bytes().as_ref()],
        bump = market.vault_bump
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = bettor,
        space = 8 + UserPosition::INIT_SPACE,
        seeds = [UserPosition::SEED, market_id.to_le_bytes().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    /// Bettor's token account (neutral ticket asset)
    #[account(
        mut,
        token::mint = config.token_mint,
        token::authority = bettor
    )]
    pub bettor_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<StakeAndCommit>,
    market_id: u64,
    amount: u64,
    commitment: [u8; 32],
) -> Result<()> {
    // Basic validations
    require!(amount > 0, PredictionMarketError::ZeroAmount);
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp < ctx.accounts.market.resolution_time,
        PredictionMarketError::MarketExpired
    );

    // Only allow a single commitment per user per market for now
    let position = &mut ctx.accounts.user_position;
    if position.market_id != 0 {
        require!(
            !position.revealed && !position.claimed && position.committed_amount == 0,
            PredictionMarketError::AlreadyCommitted
        );
    }

    // Transfer tokens into the market vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.bettor_token_account.to_account_info(),
        to: ctx.accounts.market_vault.to_account_info(),
        authority: ctx.accounts.bettor.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    transfer(cpi_ctx, amount)?;

    // Initialize or update the user position
    if position.market_id == 0 {
        position.market_id = market_id;
        position.user = ctx.accounts.bettor.key();
        // Legacy fields are kept at zero for commit-reveal
        position.yes_bet = 0;
        position.no_bet = 0;
        position.claimed = false;
        position.bump = ctx.bumps.user_position;
        position.commitment = commitment;
        position.committed_amount = amount;
        position.revealed = false;
        // 0 = Outcome::None
        position.revealed_outcome = crate::state::Outcome::None;
    } else {
        // Position already initialized but not yet committed
        require!(
            position.market_id == market_id && position.user == ctx.accounts.bettor.key(),
            PredictionMarketError::InvalidAdmin
        );
        position.commitment = commitment;
        position.committed_amount = amount;
        position.revealed = false;
        position.revealed_outcome = crate::state::Outcome::None;
    }

    Ok(())
}


